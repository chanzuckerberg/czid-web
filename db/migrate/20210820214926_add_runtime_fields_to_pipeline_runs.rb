class AddRuntimeFieldsToPipelineRuns < ActiveRecord::Migration[6.1]
  def change
    change_table :pipeline_runs, bulk: true do |t|
      t.column :executed_at, :datetime, comment: "When the pipeline run was actually dispatched for processing."
      t.column :time_to_finalized, :integer, comment: "Seconds from executed_at to marked as finished with processing, not including results loading."
      t.column :time_to_results_finalized, :integer, comment: "Seconds from executed_at to marked as finished with processing and results loading."
    end

    change_table :pipeline_run_stages, bulk: true do |t|
      t.column :executed_at, :datetime, comment: "When the pipeline run stage was actually dispatched for processing."
      t.column :time_to_finalized, :integer, comment: "Seconds from executed_at to marked as finished with processing."
    end
  end
end
