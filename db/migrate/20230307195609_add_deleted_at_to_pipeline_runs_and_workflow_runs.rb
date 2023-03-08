class AddDeletedAtToPipelineRunsAndWorkflowRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :pipeline_runs, :deleted_at, :datetime, comment: "When the user triggered deletion of the pipeline run"
    add_column :workflow_runs, :deleted_at, :datetime, comment: "When the user triggered deletion of the workflow run"
  end
end
