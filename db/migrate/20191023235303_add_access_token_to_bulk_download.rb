class AddAccessTokenToBulkDownload < ActiveRecord::Migration[5.1]
  def change
    add_column :bulk_downloads, :access_token, :string
    add_column :bulk_downloads, :progress, :float
    add_column :bulk_downloads, :ecs_task_arn, :string, comment: "The ecs task arn for this bulk download if applicable"
  end
end
