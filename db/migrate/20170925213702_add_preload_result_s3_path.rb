class AddPreloadResultS3Path < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :s3_preload_result_path, :text
  end
end
