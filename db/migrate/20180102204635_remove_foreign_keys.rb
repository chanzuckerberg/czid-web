class RemoveForeignKeys < ActiveRecord::Migration[5.1]
  def change
    remove_foreign_key :input_files, column: :sample_id
    remove_foreign_key :job_stats, column: :pipeline_output_id
    remove_foreign_key :pipeline_outputs, column: :sample_id
    remove_foreign_key :pipeline_run_stages, column: :pipeline_run_id
    remove_foreign_key :pipeline_runs, column: :sample_id
    remove_foreign_key "reports", column: :background_id
    remove_foreign_key "reports", column: :pipeline_output_id
    remove_foreign_key "samples", column: :user_id
    remove_foreign_key "taxon_byteranges", column: :pipeline_output_id
    remove_foreign_key "taxon_counts", column: :pipeline_output_id
    remove_foreign_key "taxon_summaries", column: :background_id
    remove_foreign_key "taxon_zscores", column: :report_id
    drop_table :taxon_zscores
  end
end
