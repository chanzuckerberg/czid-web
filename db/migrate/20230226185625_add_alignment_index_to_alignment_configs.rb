class AddAlignmentIndexToAlignmentConfigs < ActiveRecord::Migration[6.1]
  def change
    add_column :alignment_configs, :minimap2_long_db_path, :string, comment: "The S3 path prefix to the minimap2 index for short reads"
    add_column :alignment_configs, :minimap2_short_db_path, :string, comment: "The S3 path prefix to the minimap2 index for long reads"
    add_column :alignment_configs, :diamond_db_path, :string, comment: "The S3 path prefix to the diamond index"
  end
end
