class AddInsertSizeMetricsToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :median_insert_size, :integer
    add_column :pipeline_runs, :mode_insert_size, :integer
    add_column :pipeline_runs, :median_absolute_deviation, :integer
    add_column :pipeline_runs, :min_insert_size, :integer
    add_column :pipeline_runs, :max_insert_size, :integer
    add_column :pipeline_runs, :mean_insert_size, :integer
    add_column :pipeline_runs, :standard_deviation, :integer
    add_column :pipeline_runs, :read_pairs, :integer
  end
end
