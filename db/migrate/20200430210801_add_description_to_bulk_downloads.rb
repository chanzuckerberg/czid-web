class AddDescriptionToBulkDownloads < ActiveRecord::Migration[5.1]
  def change
    add_column :bulk_downloads, :description, :text
  end
end
