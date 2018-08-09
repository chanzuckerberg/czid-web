class PhyloTreesController < ApplicationController
  before_action :authenticate_user!
  before_action :no_demo_user, only: :create

  ########################################
  # Current logic for phylo_tree permissions:
  # 1. index/show permissions are based on viewability of all the samples
  #    that make up the tree.
  # 2. create/edit permissions are based on
  #    a. viewability of all the samles
  #    b. the project the tree belongs to
  #       (if 2 users belong to the same project, they are considered
  #        collaborators and so they can both create/edit trees for the project).
  # While project membership is used to confer create/edit permission,
  # trees created for a project may in fact contain samples from outside
  # the project. Such trees will be hidden from members of the project that do not
  # have read access to all those samples.
  ########################################

  READ_ACTIONS = [:show].freeze
  EDIT_ACTIONS = [:retry].freeze
  OTHER_ACTIONS = [:new, :create, :index].freeze

  power :phylo_trees, map: { EDIT_ACTIONS => :updatable_phylo_trees }, as: :phylo_trees_scope

  before_action :set_phylo_tree, only: READ_ACTIONS + EDIT_ACTIONS
  before_action :assert_access, only: OTHER_ACTIONS
  before_action :check_access

  def index
    @project = []
    @phylo_trees = current_power.phylo_trees
    @taxon = {}

    taxid = params[:taxid]
    project_id = params[:project_id]

    if project_id
      @project = current_power.projects.find(project_id)
      @phylo_trees = @phylo_trees.where(project_id: project_id)
    end

    if taxid
      @phylo_trees = @phylo_trees.where(taxid: taxid)
      example_taxon_count = TaxonCount.where(tax_id: taxid).last
      @taxon = { taxid: example_taxon_count.tax_id, name: example_taxon_count.name }
    end

    @phylo_trees = @phylo_trees.as_json(include: :pipeline_runs)
  end

  def new
    taxid = params[:taxid].to_i
    project_id = params[:project_id].to_i

    @project = current_power.updatable_projects.find(project_id)

    # Retrieve all pipeline runs in the specified project that contain the specified taxid.
    project_sample_ids = current_power.project_samples(@project).pluck(:id)
    pipeline_run_ids_with_taxid = TaxonCount.where(tax_id: taxid).where(count_type: 'NT').pluck(:pipeline_run_id)
    @pipeline_runs = PipelineRun.top_completed_runs.where(sample_id: project_sample_ids).where(id: pipeline_run_ids_with_taxid)

    # Retrieve information for displaying the tree's sample list.
    @samples = sample_details_json(@pipeline_runs, taxid)

    # Retrieve information about the taxon
    example_taxon_count = @pipeline_runs.first.taxon_counts.find_by(tax_id: taxid)
    taxon_name = example_taxon_count.name
    tax_level = example_taxon_count.tax_level
    @taxon = { taxid: taxid, tax_level: tax_level, name: taxon_name }
  end

  def show
    @project = current_power.projects.find(@phylo_tree.project_id)
    @samples = sample_details_json(PipelineRun.where(id: @phylo_tree.pipeline_run_ids), @phylo_tree.taxid)
    @phylo_tree = @phylo_tree.as_json(include: :pipeline_runs)
  end

  def retry
    if @phylo_tree.status == PhyloTree::STATUS_FAILED
      @phylo_tree.update(status: PhyloTree::STATUS_INITIALIZED)
      Resque.enqueue(KickoffPhyloTree, @phylo_tree.id)
      render json: { status: :ok, message: "retry submitted" }
    else
      render json: { status: :conflict, message: "a tree run is already in progress for this project and taxon" }
    end
  end

  def create
    @project = current_power.updatable_projects.find(params[:project_id])
    name = params[:name]
    taxid = params[:taxid].to_i
    tax_level = params[:tax_level].to_i
    tax_name = params[:tax_name]

    pipeline_run_ids = params[:pipeline_run_ids].map(&:to_i)
    pt = PhyloTree.new(name: name, taxid: taxid, tax_level: tax_level, tax_name: tax_name, user_id: current_user.id, project_id: @project.id, pipeline_run_ids: pipeline_run_ids)
    if pt.save
      Resque.enqueue(KickoffPhyloTree, pt.id)
      render json: { status: :ok, message: "tree creation job submitted" }
    else
      render json: { status: :not_acceptable, message: pt.errors.full_messages }
    end
  end

  private

  def set_phylo_tree
    @phylo_tree = phylo_trees_scope.find(params[:id])
    assert_access
  end

  def sample_details_json(pipeline_runs, taxid)
    # Retrieve information for displaying the tree's sample list.
    # Expose it as an array of hashes containing
    # - sample name
    # - pipeline run id to be used for the sample
    # - number of reads matching the specified taxid in NT
    return [] if pipeline_runs.blank?
    Sample.connection.select_all("
                   select pipeline_run_ids_sample_names.name,
                          pipeline_run_ids_sample_names.pipeline_run_id,
                          taxon_counts.count as taxid_nt_reads
                   from (select pipeline_runs.id as pipeline_run_id, samples.name
                         from pipeline_runs
                         inner join samples
                         on pipeline_runs.sample_id = samples.id
                         where pipeline_runs.id in (#{pipeline_runs.pluck(:id).join(',')})) pipeline_run_ids_sample_names
                   inner join taxon_counts
                   on taxon_counts.pipeline_run_id = pipeline_run_ids_sample_names.pipeline_run_id
                   where taxon_counts.tax_id = #{taxid} and taxon_counts.count_type = 'NT'
    ").to_hash
  end
end
