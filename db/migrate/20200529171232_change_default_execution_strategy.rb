class ChangeDefaultExecutionStrategy < ActiveRecord::Migration[5.2]
  def up
    change_column :samples, :pipeline_execution_strategy, :string, default: nil
    change_column :pipeline_runs, :pipeline_execution_strategy, :string, default: PipelineRun.pipeline_execution_strategies[:step_function]
  end

  def down
    change_column :samples, :pipeline_execution_strategy, :string, default: "directed_acyclic_graph"
    change_column :pipeline_runs, :pipeline_execution_strategy, :string, default: "directed_acyclic_graph"
  end
end
