class AddBowtieIndexPathToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :s3_bowtie2_index_path, :text
  end
end
