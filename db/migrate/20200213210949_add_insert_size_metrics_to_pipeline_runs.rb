class AddInsertSizeMetricsToPipelineRuns < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :insert_size_median, :integer
    add_column :pipeline_runs, :insert_size_mode, :integer
    add_column :pipeline_runs, :insert_size_median_absolute_deviation, :integer
    add_column :pipeline_runs, :insert_size_min, :integer
    add_column :pipeline_runs, :insert_size_max, :integer
    add_column :pipeline_runs, :insert_size_mean, :integer
    add_column :pipeline_runs, :insert_size_standard_deviation, :integer
    add_column :pipeline_runs, :insert_size_read_pairs, :integer
  end
end
