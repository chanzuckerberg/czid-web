class AddStarIndexPathToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :s3_star_index_path, :text
  end
end
