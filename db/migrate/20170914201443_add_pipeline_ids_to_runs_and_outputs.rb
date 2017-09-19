class AddPipelineIdsToRunsAndOutputs < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_outputs, :pipeline_run_id, :bigint
    add_index  :pipeline_outputs, :pipeline_run_id, unique: true

    add_column :pipeline_runs, :pipeline_output_id, :bigint
    add_index  :pipeline_runs, :pipeline_output_id, unique: true
  end
end
