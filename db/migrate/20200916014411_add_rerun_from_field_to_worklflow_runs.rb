class AddRerunFromFieldToWorklflowRuns < ActiveRecord::Migration[5.2]
  def change
    add_column :workflow_runs, :rerun_from, :bigint
  end
end
