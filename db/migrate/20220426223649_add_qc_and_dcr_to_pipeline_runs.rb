class AddQcAndDcrToPipelineRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :pipeline_runs, :qc_percent, :float
    add_index :pipeline_runs, :qc_percent

    add_column :pipeline_runs, :compression_ratio, :float
    add_index :pipeline_runs, :compression_ratio
  end
end
