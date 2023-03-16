class AddDeletedAtToBulkDownloads < ActiveRecord::Migration[6.1]
  def change
    add_column :bulk_downloads, :deleted_at, :datetime, comment: "When the user triggered deletion of the bulk download"
  end
end
