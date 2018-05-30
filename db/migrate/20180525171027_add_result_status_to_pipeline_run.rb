class AddResultStatusToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :result_status, :text
    add_column :pipeline_runs, :results_finalized, :integer, default: 0, null: false
  end
end
