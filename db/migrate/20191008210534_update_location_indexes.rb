class UpdateLocationIndexes < ActiveRecord::Migration[5.1]
  def up
    remove_index :locations, name: "index_locations_on_locationiq_id"
    add_index :locations, [:name, :geo_level, :country_name, :state_name, :subdivision_name, :city_name], name: "index_locations_name_fields", comment: "Index for lookup by important fields for identifying places. Composite works for any left subset of columns."
  end

  def down
    add_index :locations, [:locationiq_id]
    remove_index :locations, name: "index_locations_name_fields"
  end
end
