class AddPipelineTypeToSamples < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :pipeline_type, :string, default: "DAG", comment: "A soft enum (string) describing which pipeline infrastructure to run the sample on."
    add_column :pipeline_runs, :pipeline_type, :string, default: "DAG", comment: "A soft enum (string) describing which pipeline infrastructure the pipeline run was performed on."
  end
end
