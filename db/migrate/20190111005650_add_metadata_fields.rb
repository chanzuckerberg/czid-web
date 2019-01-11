class AddMetadataFields < ActiveRecord::Migration[5.1]
  def change
    create_table :metadata_fields do |t|
      # Name/key ex: "sample_type"
      t.string :name, null: false

      # User-friendly display name ex: "Sample Type"
      t.string :display_name

      # Human-readable description e.g. "Type of sample or tissue such as plasma, whole blood, etc."
      t.string :description

      # Base data type. 0 for string, 1 for number, 2 for dates. Used for figuring out which column
      # to use in "metadata-data" ex: string_validated_value, number_validated_value,
      # date_validated_value.
      t.integer :base_type, limit: 1, null: false

      # Name of a validation type corresponding to a 'hardcoded' validation function.
      # Ex: "positive_number" here would call a positive_number validator in code dynamically (with
      # a restricted set of functions we make). Or lat_lon would validate coordinates like
      # "37.485214, -122.236359".
      t.string :validation_type

      # Going to be an array of options when applicable. Ex for nucleotide_type: ["DNA", "RNA"].
      # Unfortunately our RDS flavor/version doesn't support json types so this is string.
      t.string :options

      # If true then only allow users to use the options (i.e. no freetext).
      t.integer :force_options, limit: 1, default: 0

      # +----------------------+
      # |      All fields      |
      # | +------------------+ |
      # | |      Core        | |
      # | | +--------------+ | |
      # | | |   Default    | | |
      # | | | +----------+ | | |
      # | | | | Required | | | |
      # | | | +__________+ | | |
      # | | +______________+ | |
      # | +__________________+ |
      # +______________________+

      # The core fields are basically the set of fields that we think are important/interesting/have
      # curated ourselves. All user-created custom types will not be core (unless we make them).
      # Ex: lat_lon could be a core field but not on new projects by default.
      t.integer :is_core, limit: 1, default: 0

      # Default fields are a subset of the core fields that will appear when someone creates a
      # project. These can be removed from a project.
      t.integer :is_default, limit: 1, default: 0

      # Required fields are a subset of the core/default fields that cannot be removed from the
      # project. Ex: collection_date, location, nucleotide_type, etc.
      t.integer :is_required, limit: 1, default: 0

      # Name of a group of fields for the frontend. Ex: Sample, Donor, Infection, Sequencing, etc.
      t.string :group

      t.timestamps
    end

    # Additions to metadata-data. A metadata_field has many metadata.
    add_reference :metadata, :metadata_field, foreign_key: true, index: true
  end
end
