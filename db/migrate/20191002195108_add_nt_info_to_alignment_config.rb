class AddNtInfoToAlignmentConfig < ActiveRecord::Migration[5.1]
  def change
    add_column :alignment_configs, :s3_nt_info_db_path, :text
  end
end
