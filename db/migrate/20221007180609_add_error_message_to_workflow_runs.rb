class AddErrorMessageToWorkflowRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :workflow_runs, :error_message, :text
  end
end
