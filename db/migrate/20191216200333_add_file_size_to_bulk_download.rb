class AddFileSizeToBulkDownload < ActiveRecord::Migration[5.1]
  def change
    add_column :bulk_downloads, :output_file_size, :integer, comment: "The file size of the generated output file. Can be nil while the file is being generated."
  end
end
