class AddOsmTypeAndIndexes < ActiveRecord::Migration[5.1]
  def change
    add_column :locations, :osm_type, :string, limit: 10, default: "", null: false, comment: "OpenStreetMap type (Node, Way, or Relation) to use OSM ID"

    add_index :locations, [:osm_type, :osm_id]
    add_index :locations, [:locationiq_id]

    add_column :metadata, :location_id, :integer
  end
end
