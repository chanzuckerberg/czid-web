class ChangeDefaultExecutionStrategy < ActiveRecord::Migration[5.2]
  def change
    change_column :samples, :pipeline_execution_strategy, :string, default: nil
    change_column :pipeline_runs, :pipeline_execution_strategy, :string, default: nil
  end
end
