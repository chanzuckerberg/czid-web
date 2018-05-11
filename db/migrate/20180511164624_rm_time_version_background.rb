class RmTimeVersionBackground < ActiveRecord::Migration[5.1]
  def change
    remove_index :backgrounds, name: "index_backgrounds_on_name_and_pipeline_version_and_time_version"
    remove_column :backgrounds, :time_version
    add_index :backgrounds, ["name", "pipeline_version", "created_at"], unique: true
  end
end
