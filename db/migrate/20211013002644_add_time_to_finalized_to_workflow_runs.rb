class AddTimeToFinalizedToWorkflowRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :workflow_runs, :time_to_finalized, :integer, comment: "Seconds from executed_at to marked as finished with processing."
  end
end
