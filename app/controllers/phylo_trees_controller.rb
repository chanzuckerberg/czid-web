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
                 # Hardcode the species-level for now.
                 # TODO(charles): clean up when we actually implement genus-level support.
                 name: taxon_lineage.species_name }
    end

    # Augment tree data with number of pipeline_runs
    @phylo_trees = @phylo_trees.as_json
    @phylo_trees.each do |pt|
      pt["n_pipeline_runs"] = PhyloTree.run_counts_by_tree_id[pt["id"]]["n_pipeline_runs"]
    end
  end

  def new
    taxid = params[:taxid].to_i
    project_id = params[:project_id].to_i

    @project = current_power.updatable_projects.find(project_id)

    # Retrieve pipeline runs that contain the specified taxid.
    eligible_pipeline_runs = current_power.pipeline_runs.top_completed_runs
    all_pipeline_run_ids_with_taxid = TaxonByterange.where(taxid: taxid).where(hit_type: 'NT').pluck(:pipeline_run_id)
    eligible_pipeline_run_ids_with_taxid = eligible_pipeline_runs.where(id: all_pipeline_run_ids_with_taxid).pluck(:id)

    # Retrieve information for displaying the tree's sample list.
    @samples = sample_details_json(eligible_pipeline_run_ids_with_taxid, taxid)

    # Retrieve information about the taxon
    taxon_lineage = TaxonLineage.where(taxid: taxid).last
    @taxon = { taxid: taxid,
               # Hardcode the species-level for now.
               # TODO(charles): clean up when we actually implement genus-level support.
               name: taxon_lineage.species_name }
  end

  def show
    @project = current_power.projects.find(@phylo_tree.project_id)
    @samples = sample_details_json(@phylo_tree.pipeline_run_ids, @phylo_tree.taxid)
    @phylo_tree_augmented = @phylo_tree.as_json(include: :pipeline_runs)
    @can_edit = current_power.updatable_phylo_tree?(@phylo_tree)
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
    pipeline_run_ids = params[:pipeline_run_ids].map(&:to_i)

    name = params[:name]
    taxid = params[:taxid].to_i
    tax_name = params[:tax_name]

    ### Add method to detect tax_level here

    non_viewable_pipeline_run_ids = pipeline_run_ids.to_set - current_power.pipeline_runs.pluck(:id).to_set
    if !non_viewable_pipeline_run_ids.empty?
      render json: {
        status: :unauthorized,
        message: "You are not authorized to view all pipeline runs in the list."
      }
    else
      pt = PhyloTree.new(name: name, taxid: taxid, tax_level: tax_level, tax_name: tax_name, user_id: current_user.id, project_id: @project.id, pipeline_run_ids: pipeline_run_ids)
      if pt.save
        Resque.enqueue(KickoffPhyloTree, pt.id)
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

    # Retrieve information for displaying the tree's sample list.
    # Expose it as an array of hashes containing
    # - sample name
    # - project id and name
    # - pipeline run id to be used for the sample
    samples_projects = Sample.connection.select_all("
      select
        samples.name,
        samples.project_id,
        projects.name as project_name,
        pipeline_runs.id as pipeline_run_id
      from pipeline_runs, projects, samples
      where
        pipeline_runs.id in (#{pipeline_run_ids.join(',')}) and
        pipeline_runs.sample_id = samples.id and
        samples.project_id = projects.id
    ").to_a

    # Also add:
    # - number of reads matching the specified taxid in NT
    # Do not include the query on taxon_counts in the previous query above using a join,
    # because the taxon_counts table is large.
    taxon_counts = TaxonCount.where(pipeline_run_id: pipeline_run_ids).where(tax_id: taxid).where(count_type: 'NT').index_by(&:pipeline_run_id)
    samples_projects.each do |sp|
      sp["taxid_nt_reads"] = taxon_counts[sp["pipeline_run_id"]].count
    end

    samples_projects
  end
end
