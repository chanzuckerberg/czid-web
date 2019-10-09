class CreateBulkDownloadsTable < ActiveRecord::Migration[5.1]
  def change
    create_table :bulk_downloads do |t|
      t.text "params_json", comment: "JSON of the params for this bulk download"
      t.string "download_type", comment: "The type of bulk download", null: false
      t.string "status", comment: "The current status of the download, e.g. waiting, running, error, success", null: false
      t.string "error_message", comment: "An error message to display to the user."
    end

    create_join_table :pipeline_runs, :bulk_downloads do |t|
      t.index [:pipeline_run_id]
      t.index [:bulk_download_id]
    end

    add_foreign_key "bulk_downloads_pipeline_runs", :bulk_downloads, name: "bulk_downloads_pipeline_runs_bulk_download_id_fk"
    add_foreign_key "bulk_downloads_pipeline_runs", :pipeline_runs, name: "bulk_downloads_pipeline_runs_pipeline_run_id_fk"
  end
end
