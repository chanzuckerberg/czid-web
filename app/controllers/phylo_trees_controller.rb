class PhyloTreesController < ApplicationController
  include ApplicationHelper
  include SamplesHelper
  include PipelineRunsHelper
  include ElasticsearchHelper
  include ParameterSanitization

  before_action :login_required, only: :create

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

  READ_ACTIONS = [:show, :download].freeze
  EDIT_ACTIONS = [:retry].freeze
  OTHER_ACTIONS = [:new, :create, :index, :choose_taxon, :validate_name].freeze

  power :phylo_trees, map: { EDIT_ACTIONS => :updatable_phylo_trees }, as: :phylo_trees_scope

  before_action :set_phylo_tree, only: READ_ACTIONS + EDIT_ACTIONS
  before_action :assert_access, only: OTHER_ACTIONS
  before_action :check_access

  def index
    @project = []
    # Common use case is looking for the most recently created phylo tree
    @phylo_trees = current_power.phylo_trees.order(updated_at: :desc)
    @taxon = {}

    taxid = params[:taxId]
    if HUMAN_TAX_IDS.include? taxid.to_i
      render json: { status: :forbidden, message: "Human taxon ids are not allowed" }
      return
    end
    project_id = params[:projectId]

    # Restrict to specified project
    if project_id
      @project = current_power.projects.find(project_id)
      @phylo_trees = @phylo_trees.where(project_id: project_id)
    end

    # Restrict to specified taxid
    if taxid
      @phylo_trees = @phylo_trees.where(taxid: taxid)
      taxon_lineage = TaxonLineage.where(taxid: taxid).last
      @taxon = { taxid: taxid,
                 name: taxon_lineage.name, }
    end

    # Augment tree data with user name
    users_map = PhyloTree.users_by_tree_id
    @phylo_trees = @phylo_trees.as_json
    @phylo_trees.each do |pt|
      pt["user"] = users_map[pt["id"]]
    end

    respond_to do |format|
      format.html
      format.json do
        render json: {
          project: @project,
          taxon: @taxon,
          phyloTrees: @phylo_trees,
        }
      end
    end
  end

  def show
    pt = @phylo_tree.as_json(only: ["id", "name", "taxid", "tax_level", "tax_name", "newick", "status"])
    pt["user"] = @phylo_tree.user.name
    pt["parent_taxid"] = TaxonLineage.where(taxid: @phylo_tree.taxid).last.genus_taxid if @phylo_tree.tax_level == 1

    nodes = {}
    # populate metadata for sample nodes
    metadata_by_sample_id = Metadatum.by_sample_ids(@phylo_tree.pipeline_runs.pluck(:sample_id).uniq, use_raw_date_strings: true)
    @phylo_tree.pipeline_runs
               .joins(:sample, sample: [:project, :host_genome])
               .select("pipeline_runs.id, samples.id as sample_id," \
                       "samples.name, projects.name as project_name," \
                       "host_genomes.name as host_genome_name")
               .as_json.each do |pr|
      nodes[pr["id"]] = {
        "pipeline_run_id" => pr["id"],
        "sample_id" => pr["sample_id"],
        "name" => pr["name"],
        "project_name" => pr["project_name"],
        "host_genome_name" => pr["host_genome_name"],
        "metadata" => metadata_by_sample_id[pr["sample_id"]],
      }
    end
    # populate metadata for NCBI nodes
    ncbi_metadata = JSON.parse(@phylo_tree.ncbi_metadata || "{}")
    ncbi_metadata.each do |node_id, node_metadata|
      nodes[node_id] = node_metadata
      nodes[node_id]["name"] ||= node_metadata["accession"]
    end
    # add node information to phylo_tree json
    pt["sampleDetailsByNodeName"] = nodes

    respond_to do |format|
      format.html
      format.json do
        render json: pt
      end
    end
  end

  def choose_taxon
    taxon_search_args = [params[:query]]
    taxon_search_args << params[:args].split(",") if params[:args].present?
    filters = {}
    filters[:project_id] = params[:project_id]
    filters[:samples] = Sample.where(id: params[:sample_id]) if params[:sample_id]
    taxon_search_args << filters
    taxon_list = taxon_search(*taxon_search_args)
    render json: JSON.dump(taxon_list)
  end

  def new
    taxid = params[:taxId].to_i
    if HUMAN_TAX_IDS.include? taxid.to_i
      render json: { status: :forbidden, message: "Human taxon ids are not allowed" }
      return
    end
    project_id = params[:projectId].to_i

    @project = current_power.updatable_projects.find(project_id)

    # Retrieve pipeline runs that contain the specified taxid.
    eligible_pipeline_runs = current_power.pipeline_runs.top_completed_runs
    all_pipeline_run_ids_with_taxid = TaxonByterange.where(taxid: taxid).pluck(:pipeline_run_id)
    eligible_pipeline_run_ids_with_taxid = eligible_pipeline_runs.where(id: all_pipeline_run_ids_with_taxid).pluck(:id)

    # Retrieve information for displaying the tree's sample list.
    @samples = sample_details_json(eligible_pipeline_run_ids_with_taxid, taxid)

    # Retrieve information about the taxon
    taxon_lineage = TaxonLineage.where(taxid: taxid).last
    @taxon = { taxid: taxid,
               name: taxon_lineage.name, }

    respond_to do |format|
      format.html
      format.json do
        render json: {
          project: @project,
          taxon: @taxon,
          samples: @samples,
          csrf: form_authenticity_token,
        }
      end
    end
  end

  def validate_name
    # current flow saves a sanitized name, thus use the same sanitized name to check
    name = sanitize_title_name(params[:name])
    pt = PhyloTree.new(name: name)
    pt.valid?
    render json: {
      valid: !pt.errors.key?(:name),
      sanitizedName: name,
    }
  end

  def retry
    if @phylo_tree.status == PhyloTree::STATUS_FAILED
      @phylo_tree.update(status: PhyloTree::STATUS_INITIALIZED,
                         job_id: nil, job_log_id: nil, job_description: nil, command_stdout: nil, command_stderr: nil)
      Resque.enqueue(KickoffPhyloTree, @phylo_tree.id)
      render json: { status: :ok, message: "retry submitted" }
    else
      render json: { status: :conflict, message: "a tree run is already in progress for this project and taxon" }
    end
  end

  def download
    output = params[:output]
    local_file = Tempfile.new
    s3_file = @phylo_tree[output]
    if s3_file && download_to_filename?(s3_file, local_file.path)
      send_file local_file.path, filename: "#{@phylo_tree.name.downcase.gsub(/\W/, '-')}__#{File.basename(s3_file)}"
    else
      local_file.close
      LogUtil.log_err_and_airbrake("downloading #{s3_file} failed")
      head :not_found
    end
  end

  def create
    taxid = params[:taxId].to_i
    if HUMAN_TAX_IDS.include? taxid.to_i
      render json: { status: :forbidden, message: "Human taxon ids are not allowed" }
      return
    end

    @project = current_power.updatable_projects.find(params[:projectId])
    pipeline_run_ids = params[:pipelineRunIds].map(&:to_i)

    name = sanitize_title_name(params[:name])
    tax_name = params[:taxName]
    dag_branch = if current_user.admin?
                   params[:dagBranch] || "master"
                 else
                   "master"
                 end
    dag_vars = params[:dagVars] if current_user.admin?

    tax_level = TaxonLineage.where(taxid: taxid).last.tax_level

    non_viewable_pipeline_run_ids = pipeline_run_ids.to_set - current_power.pipeline_runs.pluck(:id).to_set
    if !non_viewable_pipeline_run_ids.empty?
      render json: {
        status: :unauthorized,
        message: "You are not authorized to view all pipeline runs in the list.",
      }
    else
      pt = PhyloTree.new(name: name, taxid: taxid, tax_level: tax_level, tax_name: tax_name, user_id: current_user.id, project_id: @project.id, pipeline_run_ids: pipeline_run_ids, dag_branch: dag_branch, dag_vars: dag_vars)
      if pt.save
        Resque.enqueue(KickoffPhyloTree, pt.id)
        Rails.logger.info("PhyloTreeCreation: Starting to run phylo tree job #{name}...")
        render json: { status: :ok, message: "tree creation job submitted", phylo_tree_id: pt.id }
      else
        render json: { status: :not_acceptable, message: pt.errors.full_messages }
      end
    end
  end

  private

  def set_phylo_tree
    @phylo_tree = phylo_trees_scope.find(params[:id])
    assert_access
  end

  def sample_details_json(pipeline_run_ids, taxid)
    return [] if pipeline_run_ids.blank?
    return [] if HUMAN_TAX_IDS.include? taxid.to_i

    # Retrieve information for displaying the tree's sample list.
    # Expose it as an array of hashes containing
    # - sample name
    # - project id and name
    # - pipeline run id to be used for the sample.
    samples_projects = Sample.connection.select_all("
      select
        samples.name,
        samples.project_id,
        samples.created_at,
        host_genomes.name as host,
        projects.name as project_name,
        pipeline_runs.id as pipeline_run_id,
        samples.id as sample_id
      from pipeline_runs, projects, samples, host_genomes
      where
        pipeline_runs.id in (#{pipeline_run_ids.join(',')}) and
        pipeline_runs.sample_id = samples.id and
        samples.project_id = projects.id and
        host_genomes.id = samples.host_genome_id
    ").to_a

    # Also add:
    # - number of reads matching the specified taxid.
    # Do not include the query on taxon_counts in the previous query above using a join,
    # because the taxon_counts table is large.
    taxon_counts = TaxonCount.where(pipeline_run_id: pipeline_run_ids).where(tax_id: taxid).index_by { |tc| "#{tc.pipeline_run_id},#{tc.count_type}" }

    metadata_by_sample_id = Metadatum.by_sample_ids(samples_projects.pluck("sample_id"), use_raw_date_strings: true)

    samples_projects.each do |sp|
      sp["taxid_reads"] ||= {}
      %w[NT NR].each do |count_type|
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
