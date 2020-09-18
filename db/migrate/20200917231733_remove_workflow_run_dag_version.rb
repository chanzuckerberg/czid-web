class RemoveWorkflowRunDagVersion < ActiveRecord::Migration[5.2]
  def change
    remove_column :workflow_runs, :dag_version
  end
end
