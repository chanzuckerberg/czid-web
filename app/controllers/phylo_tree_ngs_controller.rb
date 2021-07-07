class PhyloTreeNgsController < ApplicationController
  include ElasticsearchHelper
  include ParameterSanitization

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
  before_action :set_phylo_tree, only: [:show]

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

  # TODO: CH-142672
  def new
  end

  # TODO: CH-142672
  def create
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

  # TODO: CH-142676
  def download
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
    params.permit(:id)
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
end
