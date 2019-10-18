class AddTimestampToBulkDownloads < ActiveRecord::Migration[5.1]
  def change
    add_column :bulk_downloads, :created_at, :datetime, null: false # rubocop:disable NotNullColumn
    add_column :bulk_downloads, :updated_at, :datetime, null: false # rubocop:disable NotNullColumn
  end
end
