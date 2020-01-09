class ChangeOutputFileSizeToBigInt < ActiveRecord::Migration[5.1]
  def change
    change_column :bulk_downloads, :output_file_size, :bigint
  end
end
