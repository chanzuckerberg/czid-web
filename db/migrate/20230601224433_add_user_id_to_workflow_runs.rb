class AddUserIdToWorkflowRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :workflow_runs, :user_id, :bigint, comment: "The ID of the user who kicked off the workflow run"
  end
end
