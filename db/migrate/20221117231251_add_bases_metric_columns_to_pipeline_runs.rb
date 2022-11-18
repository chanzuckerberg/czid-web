class AddBasesMetricColumnsToPipelineRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :pipeline_runs, :total_bases, :bigint
    add_column :pipeline_runs, :unmapped_bases, :bigint
    add_column :pipeline_runs, :fraction_subsampled_bases, :float
    add_column :pipeline_runs, :truncated_bases, :bigint
  end
end
