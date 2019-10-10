class AddUsersToBulkDownloads < ActiveRecord::Migration[5.1]
  def change
    create_join_table :users, :bulk_downloads do |t|
      t.index [:user_id]
      t.index [:bulk_download_id]
    end

    add_foreign_key "bulk_downloads_users", :bulk_downloads, name: "bulk_downloads_users_bulk_download_id_fk"
    add_foreign_key "bulk_downloads_users", :users, name: "bulk_downloads_users_user_id_fk"
  end
end
