class AddLocationTable < ActiveRecord::Migration[5.1]
  def up
    create_table :locations, force: true do |t|
      t.string :name, default: "", null: false, comment: "Full display name, such as a complete address"
      t.string :level_name, default: "", null: false, limit: 20, comment: "Level of specificity (country, state, subdivision, or city)"
      t.string :country_name, default: "", null: false, limit: 100, comment: "Country (or equivalent) of this location if available"
      t.string :state_name, default: "", null: false, limit: 100, comment: "State (or equivalent) of this location if available"
      t.string :subdivision_name, default: "", null: false, limit: 100, comment: "Second-level administrative division (e.g. county/district/division/province/etc.) of this location if available"
      t.string :city_name, default: "", null: false, limit: 100, comment: "City (or equivalent) of this location if available"

      # Recommended settings for lat/lon
      t.decimal :lat, precision: 10, scale: 6, comment: "The latitude of this location if available"
      t.decimal :lon, precision: 10, scale: 6, comment: "The longitude of this location if available"

      t.timestamps
    end

    # Add indexes
    add_index :locations, :name, comment: "Index for lookup by location name"
    add_index :locations, :level_name, comment: "Index for lookup by level of specificity"
    add_index :locations, [:country_name, :state_name, :subdivision_name, :city_name], name: "index_locations_levels", comment: "Index for lookup within regions. Composite works for any left subset of columns."
  end

  def down
    drop_table :locations
  end
end
