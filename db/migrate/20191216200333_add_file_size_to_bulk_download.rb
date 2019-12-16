class AddFileSizeToBulkDownload < ActiveRecord::Migration[5.1]
  def change
    add_column :bulk_downloads, :output_file_size, :integer
  end
end
