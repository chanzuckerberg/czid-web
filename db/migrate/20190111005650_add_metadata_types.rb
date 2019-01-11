class AddMetadataTypes < ActiveRecord::Migration[5.1]
  def change
    create_table :metatypes do |t|
      # Name/key ex: "sample_type"
      t.string :name, null: false

      # User-friendly display name ex: "Sample Type"
      t.string :display_name

      # Human-readable description e.g. "Type of sample or tissue such as plasma,
      # whole blood, etc."
      t.string :description

      # Base data type. 0 for string, 1 for number, 2 for dates. Used for figuring
      # out which column to use in "metadata-data" ex: string_validated_value,
      # number_validated_value, date_validated_value.
      t.integer :base_type, limit: 1, null: false

      # Name of a validation type corresponding to a 'hardcoded' validation function.
      # Ex: A "lat_lon" type would call a lat_lon_validator dynamically which would
      # validate that the input represents valid coordinates like "37.485214, -122.236359".
      t.string :validation_type
    end

    # Additions to metadata-data. A metatype has many metadata.
    add_reference :metadata, :metatype, index: true
    add_foreign_key :metadata, :metatype
  end
end
