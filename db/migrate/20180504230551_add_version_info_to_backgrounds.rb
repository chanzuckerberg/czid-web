class AddVersionInfoToBackgrounds < ActiveRecord::Migration[5.1]
  def change
    add_column :backgrounds, :pipeline_version, :string
    add_column :backgrounds, :time_version, :bigint
    remove_index :backgrounds, name: "index_backgrounds_on_name"
    add_index :backgrounds, ["name", "pipeline_version", "time_version"], unique: true
    Background.all.each { |bg| bg.set_version; bg.save }
  end
end
