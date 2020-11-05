class CreateJoinTableBulkDownloadWorkflowRuns < ActiveRecord::Migration[5.2]
  def change
    create_join_table :bulk_downloads, :workflow_runs do |t|
      t.index [:bulk_download_id], name: "index_bulk_downloads_workflow_runs_on_bulk_download_id"
      t.index [:workflow_run_id], name: "index_bulk_downloads_workflow_runs_on_workflow_run_id"
    end

    add_foreign_key "bulk_downloads_workflow_runs", :bulk_downloads, name: "bulk_downloads_workflow_runs_bulk_download_id_fk"
    add_foreign_key "bulk_downloads_workflow_runs", :workflow_runs, name: "bulk_downloads_workflow_runs_workflow_run_id_fk"
  end
end
