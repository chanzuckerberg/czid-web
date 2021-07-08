class PhyloTreeNgsController < ApplicationController
  include ElasticsearchHelper
  include ParameterSanitization
  include PipelineOutputsHelper

  ########################################
  # Current logic for phylo_tree permissions:
  # 1. index/show permissions are based on viewability of all the samples
  #    that make up the tree.
  # 2. create/edit permissions are based on
  #    a. viewability of all the samples
  #    b. the project the tree belongs to
  #       (if 2 users belong to the same project, they are considered
  #        collaborators and so they can both create/edit trees for the project).
  # While project membership is used to confer create/edit permission,
  # trees created for a project may in fact contain samples from outside
  # the project. Such trees will be hidden from members of the project that do not
  # have read access to all those samples.
  ########################################

  before_action :admin_required, only: [:rerun]
  before_action :set_phylo_tree, only: [:show, :download]

  # Carried over from PhyloTreesController:
  # This limit determines how many rows can be displayed in "additional samples".
  # This limit was added because the phylo tree creation was timing out for admins
  # and otherwise the results will grow without bound per user.
  ELIGIBLE_PIPELINE_RUNS_LIMIT = 1000
  PIPELINE_RUN_IDS_WITH_TAXID_LIMIT = 10_000

  def index
    permitted_params = index_params
    tax_id = permitted_params[:taxId]&.to_i
    project_id = permitted_params[:projectId]

    if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id
      render json: { message: "Human taxon ids are not allowed" }, status: :forbidden
    else
      phylo_tree_ngs = fetch_phylo_tree_ngs(filters: permitted_params.slice(:taxId, :projectId))
      phylo_tree_ngs = format_phylo_tree_ngs(phylo_tree_ngs: phylo_tree_ngs, mode: "basic")

      project = current_power.projects.find(project_id) if project_id.present?
      taxon_name = TaxonLineage.where(taxid: tax_id).last.name if tax_id.present?

      respond_to do |format|
        format.html
        format.json do
          render json: {
            project: project,
            taxonName: taxon_name,
            phyloTrees: phylo_tree_ngs,
          }
        end
      end
    end
  end

  def show
    pt = @phylo_tree_ng.as_json(only: ["id", "name", "tax_id", "status"])
    results = @phylo_tree_ng.results
    taxon_lineage = TaxonLineage.where(taxid: pt["tax_id"]).last
    pt["user"] = @phylo_tree_ng.user.name
    pt["tax_level"] = TaxonCount.find_by(tax_id: pt["tax_id"]).tax_level
    pt["parent_taxid"] = taxon_lineage.genus_taxid if pt["tax_level"] == 1
    pt["tax_name"] = taxon_lineage.tax_name
    pt["newick"] = results[:newick]

    pipeline_runs = @phylo_tree_ng.pipeline_runs
    # Populate metadata for sample nodes
    metadata_by_sample_id = Metadatum.by_sample_ids(pipeline_runs.pluck(:sample_id).uniq, use_raw_date_strings: true)
    nodes = pipeline_runs.joins(sample: [:project, :host_genome]).select(
      "pipeline_runs.id, samples.id as sample_id," \
      "samples.name, projects.name as project_name," \
      "host_genomes.name as host_genome_name"
    ).as_json.each_with_object({}) do |pr, result|
      result[pr["id"]] = {
        pipeline_run_id: pr["id"],
        sample_id: pr["sample_id"],
        name: pr["name"],
        project_name: pr["project_name"],
        host_genome_name: pr["host_genome_name"],
        metadata: metadata_by_sample_id[pr["sample_id"]],
      }
    end

    # Populate metadata for NCBI nodes
    ncbi_metadata = JSON.parse(results[:ncbi_metadata] || "{}")
    ncbi_metadata.each do |node_id, node_metadata|
      nodes[node_id] = node_metadata
      nodes[node_id]["name"] ||= node_metadata["accession"]
    end

    pt["sampleDetailsByNodeName"] = nodes

    render json: pt
  end

  def new
    permitted_params = index_params
    tax_id = permitted_params[:taxId]&.to_i
    project_id = permitted_params[:projectId]&.to_i

    if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id
      render json: { message: "Human taxon ids are not allowed" }, status: :forbidden
      return
    end

    project = current_power.updatable_projects.find(project_id)

    # Retrieve the top (most recent) pipeline runs from samples that contains the specified taxid.
    eligible_pipeline_runs = current_power.pipeline_runs.top_completed_runs
    pipeline_run_ids_with_taxid = TaxonByterange.where(taxid: tax_id).order(id: :desc).limit(PIPELINE_RUN_IDS_WITH_TAXID_LIMIT).pluck(:pipeline_run_id)
    eligible_pipeline_run_ids_with_taxid =
      eligible_pipeline_runs.where(id: pipeline_run_ids_with_taxid)
                            .order(id: :desc).limit(ELIGIBLE_PIPELINE_RUNS_LIMIT).pluck(:id)
    # Always include the project's top pipeline runs (in case they were excluded due to the ELIGIBLE_PIPELINE_RUNS_LIMIT)
    project_pipeline_run_ids_with_taxid = TaxonByterange.joins(pipeline_run: [{ sample: :project }]).where(taxid: tax_id, samples: { project_id: project_id }).pluck(:pipeline_run_id)
    top_project_pipeline_run_ids_with_taxid = current_power.pipeline_runs.where(id: project_pipeline_run_ids_with_taxid).top_completed_runs.pluck(:id)

    # Retrieve information for displaying the tree's sample list.
    samples = sample_details_json(
      (eligible_pipeline_run_ids_with_taxid | top_project_pipeline_run_ids_with_taxid).uniq,
      tax_id
    )

    render json: {
      project: project,
      samples: samples,
    }
  end

  def create
    permitted_params = create_params
    pipeline_run_ids = permitted_params[:pipeline_run_ids].map(&:to_i)
    project_id = permitted_params[:project_id]&.to_i
    tax_id = permitted_params[:tax_id]&.to_i

    if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id
      render json: { message: "Human taxon ids are not allowed" }, status: :forbidden
      return
    end

    project = current_power.updatable_projects.find(project_id)
    non_viewable_pipeline_run_ids = pipeline_run_ids.to_set - current_power.pipeline_runs.pluck(:id).to_set
    if !non_viewable_pipeline_run_ids.empty?
      render json: { message: "You are not authorized to view all pipeline runs in the list." }, status: :unauthorized
    else
      phylo_tree = PhyloTreeNg.new(
        inputs_json: {
          additional_reference_accession_ids: permitted_params[:additional_reference_accession_ids],
          tax_id: tax_id,
          superkingdom_name: permitted_params[:superkingdom_name],
          pipeline_run_ids: pipeline_run_ids,
        },
        name: sanitize_title_name(permitted_params[:name]),
        project_id: project.id,
        user_id: current_user.id
      )
      begin
        phylo_tree.save!
        phylo_tree.dispatch
        render json: { status: :ok, message: "tree creation job submitted", phylo_tree_id: phylo_tree.id }
      rescue StandardError => e
        LogUtil.log_error("PhyloTreeNgFailedEvent: Phylo Tree by #{current_user.role_name} failed to save.", exception: e)
        render json: { status: :not_acceptable, message: phylo_tree.errors.full_messages }
      end
    end
  end

  def choose_taxon
    tax_levels = nil
    if collection_params[:args].present?
      # Note(2021-07-01): Right now only "species,genus" is being sent:
      tax_levels = params[:args].split(",").select { |l| TaxonCount::NAME_2_LEVEL[l] }
    end

    filters = {}
    if collection_params[:project_id]
      filters[:project_id] = current_power.projects.find(collection_params[:project_id]).id
    end
    if collection_params[:sample_id]
      # Note: 'where' because downstream expects a Relation.
      filters[:samples] = current_power.samples.where(id: collection_params[:sample_id])
    end

    taxon_list = taxon_search(collection_params[:query], tax_levels, filters)
    render json: JSON.dump(taxon_list)
  end

  # GET /phylo_tree_ngs/validate_name
  def validate_name
    # This just checks if a sanitized name would have an ActiveRecord name error:
    name = sanitize_title_name(collection_params[:name])
    pt = PhyloTreeNg.new(name: name)
    pt.valid?
    render json: {
      valid: !pt.errors.key?(:name),
      sanitizedName: name,
    }
  end

  # PUT /phylo_tree_ngs/:id/rerun
  def rerun
    phylo_tree = current_power.updatable_phylo_tree_ngs.find(member_params[:id])
    phylo_tree.rerun
    render json: { status: "success" }, status: :ok
  rescue StandardError => e
    LogUtil.log_error("Rerun trigger failed", exception: e, phylo_tree_id: phylo_tree&.id)
    render json: {
      status: "error",
      message: e.message,
    }, status: :internal_server_error
  end

  # GET /phylo_tree_ngs/:id/download
  def download
    output_name = member_params[:output]
    unless PhyloTreeNg::DOWNLOADABLE_OUTPUTS.include?(output_name)
      raise "Invalid output requested"
    end

    s3_path = @phylo_tree_ng.output_path(output_name)
    # Ex: "Cool Tree_ska.distances.tsv"
    filename = "#{@phylo_tree_ng.name}_#{File.basename(s3_path)}"
    url = get_presigned_s3_url(s3_path: s3_path, filename: filename)
    if url
      redirect_to url
    else
      raise "Requested output not found for this tree"
    end
  rescue StandardError => e
    message = "Unexpected error in phylo tree NG download"
    LogUtil.log_error(message, exception: e, id: @phylo_tree_ng.id)
    render(
      json: { status: message },
      status: :internal_server_error
    )
  end

  private

  def set_phylo_tree
    @phylo_tree_ng = current_power.viewable_phylo_tree_ngs.find(member_params[:id])
  end

  def collection_params
    params.permit(:name, :query, :args, :project_id, :sample_id)
  end

  def index_params
    params.permit(:taxId, :projectId)
  end

  def member_params
    params.permit(:id, :output)
  end

  def create_params
    params.permit(:name, :project_id, :tax_id, :superkingdom_name, { additional_reference_accession_ids: [], pipeline_run_ids: [] })
  end

  def fetch_phylo_tree_ngs(filters: {})
    phylo_tree_ngs = current_power.viewable_phylo_tree_ngs.non_deprecated.order(updated_at: :desc)
    phylo_tree_ngs = filter_phylo_tree_ngs(phylo_tree_ngs: phylo_tree_ngs, filters: filters)
    phylo_tree_ngs
  end

  def filter_phylo_tree_ngs(phylo_tree_ngs:, filters: {})
    tax_id = filters[:taxId]
    project_id = filters[:projectId]

    phylo_tree_ngs = phylo_tree_ngs.where(project_id: project_id) if project_id.present?
    phylo_tree_ngs = phylo_tree_ngs.where(tax_id: tax_id) if tax_id.present?
    phylo_tree_ngs
  end

  def format_phylo_tree_ngs(phylo_tree_ngs:, mode: "basic")
    basic_attributes = [:id, :name, :updated_at]

    if mode == "basic"
      phylo_tree_ngs = phylo_tree_ngs.includes(:user).map do |pt|
        formatted_pt = pt.slice(*basic_attributes)
        formatted_pt[:user] = pt.user.slice(:name, :id)
        formatted_pt
      end
    end

    phylo_tree_ngs
  end

  def sample_details_json(pipeline_run_ids, tax_id)
    return [] if pipeline_run_ids.blank?
    return [] if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id.to_i

    # Retrieve information for displaying the tree's sample list.
    # Expose it as an array of hashes containing
    # - sample name
    # - project id and name
    # - pipeline run id to be used for the sample.
    samples_projects = Sample.joins(:pipeline_runs, :project, :host_genome).where(
      pipeline_runs: { id: pipeline_run_ids }
    ).pluck(
      "samples.name,
      samples.project_id,
      samples.created_at,
      host_genomes.name as host,
      projects.name as project_name,
      pipeline_runs.id as pipeline_run_id,
      samples.id as sample_id"
    ).map do |name, project_id, created_at, host, project_name, pipeline_run_id, sample_id|
      {
        "name" => name,
        "project_id" => project_id,
        "created_at" => created_at,
        "host" => host,
        "project_name" => project_name,
        "pipeline_run_id" => pipeline_run_id,
        "sample_id" => sample_id,
      }
    end

    # Also add:
    # - number of reads matching the specified tax_id.
    # Do not include the query on taxon_counts in the previous query above using a join,
    # because the taxon_counts table is large.
    taxon_counts = TaxonCount.where(pipeline_run_id: pipeline_run_ids).where(tax_id: tax_id).index_by { |tc| "#{tc.pipeline_run_id},#{tc.count_type}" }

    metadata_by_sample_id = Metadatum.by_sample_ids(samples_projects.pluck("sample_id"), use_raw_date_strings: true)

    nt_nr = %w[NT NR]
    samples_projects.each do |sp|
      sp["taxid_reads"] ||= {}
      nt_nr.each do |count_type|
        key = "#{sp['pipeline_run_id']},#{count_type}"
        sp["taxid_reads"][count_type] = (taxon_counts[key] || []).count # count is a column of taxon_counts indicating number of reads
      end
      if metadata_by_sample_id[sp["sample_id"]]
        sp["sample_type"] = metadata_by_sample_id[sp["sample_id"]][:sample_type]
        sp["collection_location"] = metadata_by_sample_id[sp["sample_id"]][:collection_location_v2]
      end
    end

    samples_projects
  end
end
