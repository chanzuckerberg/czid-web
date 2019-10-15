class AddUserRefToBulkDownloads < ActiveRecord::Migration[5.1]
  def change
    add_reference :bulk_downloads, :user, foreign_key: true
  end
end
