class AddLocationTable < ActiveRecord::Migration[5.1]
  def up
    # Check conditions

    create_table :locations do |t|
      t.string name, default: "", null: false, comment: "Full display name, like a complete address"
      t.string level_name, default: "", null: false, limit: 20, comment: "Level of specificity (country, state, subdivision, or city)"
      t.string country_name, default: "", null: false, limit: 100, comment: "The country of this location if available"
      t.string state_name, default: "", null: false, limit: 100, comment: "The state of this location if available"
      t.string subdivision_name, default: "", null: false, limit: 100, comment: "Simplification for second-level administrative division (e.g. county/district/division/province/etc.) of this location if available"
      t.string city_name, default: "", null: false, limit: 100, comment: "The city of this location (or closest administrative equivalent) if available"

      # Recommended settings for lat/lon
      t.decimal lat, precision: 10, scale: 6, comment: "The latitude of this location if available"
      t.decimal lon, precision: 10, scale: 6, comment: "The longitude of this location if available"

      t.timestamps
    end

    # Add indexes
    add_index :locations, :name
    add_index :locations, :level_name
    add_index :locations, :country_name
    add_index :locations, :state_name
    add_index :locations, :subdivision_name
    add_index :locations, :city_name
  end

  def down
  end
end
