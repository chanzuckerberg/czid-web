class Power
  include Consul::Power

  def initialize(user)
    @user = user
  end

  power :backgrounds do
    Background.viewable(@user)
  end

  power :owned_backgrounds do
    Background.where(user: @user)
  end

  power :public_backgrounds do
    Background.where(public_access: 1)
  end

  power :projects do
    Project.viewable(@user)
  end

  power :updatable_projects do
    Project.editable(@user)
  end

  power :destroyable_projects do
    Project.editable(@user)
  end

  # TODO: Remove this one because it's vague
  power :samples do
    Sample.viewable(@user)
  end

  power :viewable_samples do
    Sample.viewable(@user)
  end

  power :updatable_samples do
    Sample.editable(@user)
  end

  power :destroyable_samples do
    Sample.owned_by_user(@user)
  end

  power :my_data_samples do
    Sample.my_data(@user)
  end

  power :project_samples do |project|
    Sample.viewable(@user).where(project_id: project.id)
  end

  power :updatable_project_samples do |project|
    Sample.editable(@user).where(project_id: project.id)
  end

  power :phylo_trees do
    PhyloTree.viewable(@user)
  end

  power :updatable_phylo_trees do
    PhyloTree.editable(@user)
  end

  power :destroyable_phylo_trees do
    PhyloTree.editable(@user)
  end

  power :pipeline_runs do
    PipelineRun.viewable(@user)
  end

  power :deletable_pipeline_runs do
    PipelineRun.deletable(@user)
  end

  power :visualizations do
    Visualization.viewable(@user)
  end

  power :workflow_runs do
    WorkflowRun.viewable(@user)
  end

  power :deletable_workflow_runs do
    WorkflowRun.deletable(@user)
  end

  power :samples_workflow_runs do |samples|
    WorkflowRun.viewable(@user).where(sample: samples)
  end

  power :viewable_bulk_downloads do
    BulkDownload.viewable(@user)
  end

  power :projects_by_domain do |domain|
    case domain
    when "my_data"
      @user.projects
    when "public"
      Project.public_projects
    when "updatable"
      updatable_projects
    else
      projects
    end
  end

  power :viewable_phylo_tree_ngs do
    PhyloTreeNg.viewable(@user)
  end

  power :updatable_phylo_tree_ngs do
    PhyloTreeNg.editable(@user)
  end

  power :persisted_backgrounds do
    PersistedBackground.viewable(@user)
  end
end
