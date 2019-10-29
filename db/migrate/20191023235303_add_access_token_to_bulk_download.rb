class AddAccessTokenToBulkDownload < ActiveRecord::Migration[5.1]
  def change
    add_column :bulk_downloads, :access_token, :string, null: false, default: ""
    add_column :bulk_downloads, :progress, :float, limit: 24
    add_column :bulk_downloads, :ecs_task_arn, :string, comment: "The ecs task arn for this bulk download if applicable"
  end
end
