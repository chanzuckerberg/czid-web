class AddTruncatedToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :truncated, :bigint
  end
end
