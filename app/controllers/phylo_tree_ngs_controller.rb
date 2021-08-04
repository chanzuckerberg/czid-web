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

  # GET /phylo_tree_ngs
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

  # GET /phylo_tree_ngs/:id
  def show
    respond_to do |format|
      format.html do
        # This sends it to DiscoveryViewRouter. See app/views/home/my_data.html.erb.
        render 'home/my_data'
      end

      format.json do
        pt = @phylo_tree_ng.as_json(only: ["id", "name", "tax_id", "status"])

        taxon_lineage = TaxonLineage.where(taxid: pt["tax_id"]).last
        pt["tax_name"] = taxon_lineage.tax_name

        # If the tree didn't succeed, everything below the next block is not
        # used for display:
        if @phylo_tree_ng.status != WorkflowRun::STATUS[:succeeded]
          render json: pt and return
        end

        begin
          results = @phylo_tree_ng.results
          pt["user"] = @phylo_tree_ng.user.name
          pt["tax_level"] = TaxonCount.find_by(tax_id: pt["tax_id"]).tax_level
          pt["parent_taxid"] = taxon_lineage.genus_taxid if pt["tax_level"] == 1
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
        rescue SfnExecution::OutputNotFoundError
          # If the samples were too divergent to produce a phylo tree, the newick tree output will be missing,
          # so return a url to the clustermap to display instead.
          pt["clustermap_png_url"] = get_presigned_s3_url(s3_path: @phylo_tree_ng.output_path(PhyloTreeNg::OUTPUT_CLUSTERMAP_PNG))
        end

        render json: pt
      end
    end
  end

  # GET /phylo_tree_ngs/new
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

  # POST /phylo_tree_ngs
  def create
    permitted_params = create_params
    pipeline_run_ids = permitted_params[:pipelineRunIds].map(&:to_i)
    project_id = permitted_params[:projectId]&.to_i
    tax_id = permitted_params[:taxId]&.to_i

    if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id
      render json: { message: "Human taxon ids are not allowed" }, status: :forbidden
      return
    end

    superkingdom_name = TaxonLineage.where(taxid: tax_id).last.superkingdom_name.downcase

    project = current_power.updatable_projects.find(project_id)
    non_viewable_pipeline_run_ids = pipeline_run_ids.to_set - current_power.pipeline_runs.pluck(:id).to_set
    if !non_viewable_pipeline_run_ids.empty?
      render json: { message: "You are not authorized to view all pipeline runs in the list." }, status: :unauthorized
    else
      additional_reference_accession_ids = Set.new()
      pipeline_run_ids.each do |pipeline_run_id|
        coverage_viz_summary_s3_path = current_power.pipeline_runs.find(pipeline_run_id).coverage_viz_summary_s3_path
        if coverage_viz_summary_s3_path
          coverage_viz_summary = S3Util.get_s3_file(coverage_viz_summary_s3_path)
          if coverage_viz_summary
            coverage_viz_summary = JSON.parse(coverage_viz_summary)
            best_accessions = coverage_viz_summary[tax_id.to_s]["best_accessions"]
            additional_reference_accession_ids.add(best_accessions.first["id"])
          end
        end
      end
      phylo_tree = PhyloTreeNg.new(
        inputs_json: {
          additional_reference_accession_ids: additional_reference_accession_ids.to_a || [],
          tax_id: tax_id,
          superkingdom_name: superkingdom_name,
          pipeline_run_ids: pipeline_run_ids,
        },
        name: sanitize_title_name(permitted_params[:name]),
        pipeline_runs: PipelineRun.where(id: pipeline_run_ids),
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

  # GET /phylo_tree_ngs/choose_taxon
  def choose_taxon
    tax_levels = nil
    if collection_params[:args].present?
      # Note(2021-07-01): Right now only "species,genus" is being sent:
      tax_levels = params[:args].split(",").select { |l| TaxonCount::NAME_2_LEVEL[l] }
    end

    filters = {}
    if collection_params[:projectId]
      filters[:projectId] = current_power.projects.find(collection_params[:projectId]).id
    end
    if collection_params[:sampleId]
      # Note: 'where' because downstream expects a Relation.
      filters[:samples] = current_power.samples.where(id: collection_params[:sampleId])
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
    params.permit(:name, :query, :args, :projectId, :sampleId)
  end

  def index_params
    params.permit(:taxId, :projectId)
  end

  def member_params
    params.permit(:id, :output)
  end

  def create_params
    params.permit(:name, :projectId, :taxId, { pipelineRunIds: [] })
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
        formatted_pt[:nextGeneration] = true
        formatted_pt
      end
    end

    phylo_tree_ngs
  end

  def sample_details_json(pipeline_run_ids, tax_id)
    return [] if pipeline_run_ids.blank?
    return [] if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id.to_i

    # Need left join here so we can capture contigs that contain the specified taxon, or 0 if there are no matches.
    sanitized_join_sql_statement = ActiveRecord::Base.sanitize_sql_array(["
      LEFT JOIN contigs ON (
        pipeline_runs.id = contigs.pipeline_run_id AND (
          contigs.species_taxid_nt = :tax_id OR
          contigs.species_taxid_nr = :tax_id OR
          contigs.genus_taxid_nt = :tax_id OR
          contigs.genus_taxid_nr = :tax_id
        )
      )",
                                                                          tax_id: tax_id,])

    # Retrieve information for displaying the tree's sample list.
    # Expose it as an array of hashes containing
    # - sample name
    # - project id and name
    # - pipeline run id to be used for the sample.
    # - number of contigs that contain the specified taxon
    samples_projects = current_power.pipeline_runs.joins(sample: [:project, :host_genome]).joins(Arel.sql(sanitized_join_sql_statement)).where(
      id: pipeline_run_ids
    ).group("id").pluck(Arel.sql("
      samples.name,
      samples.project_id,
      samples.created_at,
      host_genomes.name as host,
      projects.name as project_name,
      pipeline_runs.id as pipeline_run_id,
      samples.id as sample_id,
      COUNT(DISTINCT(contigs.id)) as num_contigs
    ")).map do |name, project_id, created_at, host, project_name, pipeline_run_id, sample_id, num_contigs|
      {
        "name" => name,
        "project_id" => project_id,
        "created_at" => created_at,
        "host" => host,
        "project_name" => project_name,
        "pipeline_run_id" => pipeline_run_id,
        "sample_id" => sample_id,
        "num_contigs" => num_contigs,
      }
    end

    metadata_by_sample_id = Metadatum.by_sample_ids(samples_projects.pluck("sample_id"), use_raw_date_strings: true)
    samples_projects.each do |sp|
      if metadata_by_sample_id[sp["sample_id"]]
        sp["tissue"] = metadata_by_sample_id[sp["sample_id"]][:sample_type]
        sp["location"] = metadata_by_sample_id[sp["sample_id"]][:collection_location_v2]
      end
    end

    samples_projects
  end
end
