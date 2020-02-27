class AddPipelineExecutionStrategyToSamples < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :pipeline_execution_strategy, :string, default: "directed_acyclic_graph", comment: "A soft enum (string) describing which pipeline infrastructure to run the sample on."
    add_column :pipeline_runs, :pipeline_execution_strategy, :string, default: "directed_acyclic_graph", comment: "A soft enum (string) describing which pipeline infrastructure the pipeline run was performed on."
  end
end
