class PhyloTreesController < ApplicationController
  before_action :authenticate_user!
  before_action :login_required
  before_action :set_project, except: :index
  before_action :assert_access, only: :index
  before_action :check_access
  before_action :no_demo_user, only: :create

  def index
    project_id = params[:project_id]
    if project_id
      @project = current_power.projects.find(project_id)
      @phylo_trees = PhyloTree.where(project_id: project_id.to_i)
    else
      @project = []
      @phylo_trees = PhyloTree.where(project_id: current_power.projects.pluck(:id))
    end
  end

  def show
    taxid = params[:taxid].to_i

    # Retrieve all pipeline runs in the specified project that contain the specified taxid.
    project_sample_ids = current_power.project_samples(@project).pluck(:id)
    pipeline_run_ids_with_taxid = TaxonCount.where(tax_id: taxid).where(count_type: 'NT').pluck(:pipeline_run_id)
    @pipeline_runs = PipelineRun.top_completed_runs.where(sample_id: project_sample_ids).where(id: pipeline_run_ids_with_taxid)

    # Retrieve information for displaying the tree's sample list.
    # Expose it as an array of hashes containing
    # - sample name
    # - pipeline run id to be used for the sample
    # - number of reads matching the specified taxid in NT
    @samples = if @pipeline_runs.present?
                 Sample.connection.select_all("
                   select pipeline_run_ids_sample_names.name,
                          pipeline_run_ids_sample_names.pipeline_run_id,
                          taxon_counts.count as taxid_nt_reads
                   from (select pipeline_runs.id as pipeline_run_id, samples.name
                         from pipeline_runs
                         inner join samples
                         on pipeline_runs.sample_id = samples.id
                         where pipeline_runs.id in (#{@pipeline_runs.pluck(:id).join(',')})) pipeline_run_ids_sample_names
                   inner join taxon_counts
                   on taxon_counts.pipeline_run_id = pipeline_run_ids_sample_names.pipeline_run_id
                   where taxon_counts.tax_id = #{taxid} and taxon_counts.count_type = 'NT'
                 ").to_hash
               else
                 []
               end

    # Retrieve existing tree, if any.
    # Retrieve information about the taxon either from the existing tree or from a report.
    @phylo_tree = @project.phylo_trees.find_by(taxid: taxid).as_json(include: :pipeline_runs)
    if @phylo_tree
      taxon_name = @phylo_tree["tax_name"]
      tax_level = @phylo_tree["tax_level"]
    else
      example_taxon_count = @pipeline_runs.first.taxon_counts.find_by(tax_id: taxid)
      taxon_name = example_taxon_count.name
      tax_level = example_taxon_count.tax_level
    end
    @taxon = { taxid: taxid, tax_level: tax_level, name: taxon_name }
  end

  def create
    taxid = params[:taxid].to_i
    tax_level = params[:tax_level].to_i
    tax_name = params[:tax_name]
    existing_tree = @project.phylo_trees.find_by(taxid: taxid)
    if existing_tree.present?
      if existing_tree.status == PhyloTree::STATUS_FAILED
        existing_tree.update(status: PhyloTree::STATUS_INITIALIZED)
        Resque.enqueue(KickoffPhyloTree, existing_tree.id) # retry
        render json: { status: :ok, message: "retry submitted" }
      else
        render json: { status: :conflict, message: "a tree run is already in progress for this project and taxon" }
      end
    else
      pipeline_run_ids = params[:pipeline_run_ids].split(",").map(&:to_i)
      pt = PhyloTree.create(taxid: taxid, tax_level: tax_level, tax_name: tax_name, user_id: current_user.id, project_id: @project.id, pipeline_run_ids: pipeline_run_ids)
      Resque.enqueue(KickoffPhyloTree, pt.id)
      render json: { status: :ok, message: "tree creation job submitted" }
    end
  end

  private

  def set_project
    @project = current_power.updatable_projects.find(params[:project_id])
    assert_access
  end
end
