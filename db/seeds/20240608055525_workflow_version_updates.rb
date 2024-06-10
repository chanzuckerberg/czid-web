class WorkflowVersionUpdates < SeedMigration::Migration
  def up
    # This does not existing in staging
    WorkflowVersion.find_by(workflow: "phylotree_ng").destroy

    # Fix workflow names that should be hyphenated
    WorkflowVersion.where(workflow: "consensus_genome").update(workflow: "consensus-genome")
    WorkflowVersion.where(workflow: "short_read_mngs").update(workflow: "short-read-mngs")
    WorkflowVersion.where(workflow: "long_read_mngs").update(workflow: "long-read-mngs")
  end

  def down
    WorkflowVersion.create(id: 3, workflow: "phylotree_ng", version: "6.11.0", deprecated: false, runnable: true)

    WorkflowVersion.where(workflow: "consensus-genome").update(workflow: "consensus_genome")
    WorkflowVersion.where(workflow: "short-read-mngs").update(workflow: "short_read_mngs")
    WorkflowVersion.where(workflow: "long-read-mngs").update(workflow: "long_read_mngs")
  end
end
