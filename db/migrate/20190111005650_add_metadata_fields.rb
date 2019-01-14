class AddMetadataFields < ActiveRecord::Migration[5.1]
  def change
    create_table :metadata_fields do |t|
      # Name/key ex: "sample_type"
      t.string :name, null: false, index: true

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
      # a restricted set of functions we make).
      #
      # Our current plan is that the validation function will also do the duty of inferring the
      # specificity level to set. E.g. one location validator would infer if it's a country/state/
      # city name. One date validator would accept things like "2019", "2019-01", "2019-01-14" and
      # infer year/month/date from that.
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

      # Default fields are a subset of the core fields that will appear on a project when someone
      # creates a project. These can be removed from a project.
      t.integer :is_default, limit: 1, default: 0

      # Required fields are a subset of the core/default fields that cannot be removed from the
      # project. This is the strictest level. Ex: collection_date, location, nucleotide_type, etc.
      t.integer :is_required, limit: 1, default: 0

      # Name of a group of fields for the frontend. Ex: Sample, Donor, Infection, Sequencing, etc.
      t.string :group, index: true

      t.timestamps
    end

    # Certain meta-fields are appropriate for different (and potentially multiple) hosts. E.g.
    # "Discharge Date" is only for humans. Therefore host genomes have many meta-fields and
    # meta-fields have many host genomes. This is a way of handling many-to-many /
    # has_and_belongs_to_many in Rails.
    create_join_table :host_genomes, :metadata_fields do |t|
      t.index [:host_genome_id, :metadata_field_id], name: "index_host_genomes_metadata_fields"
      t.index [:metadata_field_id, :host_genome_id], name: "index_metadata_fields_host_genomes"
    end

    # User-defined meta-fields will belong to each (and potentially multiple) projects. So
    # meta-fields have many projects and projects have many meta-fields.
    # When a user creates a new project, they'll basically get a list of all the meta-fields marked
    # "default". Then they can add and subtract from their set of meta-fields from there.
    create_join_table :projects, :metadata_fields do |t|
      t.index [:project_id, :metadata_field_id], name: "index_projects_metadata_fields"
      # Don't need to optimize for metadata_field -> projects for now.
    end

    # Additions to metadata-data. Every piece of metadata will belong to a type of metadata_field.
    add_reference :metadata, :metadata_field, index: true

    # Specificity will be used for things like dates and potentially location.
    # Ex: The user enters "January 2019" in the frontend somehow and only wants to specify it at the
    # month level. So specificity = "month".
    # Ex: The user types the name of an ambiguous location and specifies that it refers to a
    # "country" instead of a city.
    #
    # For things like location/date we should try to have a consistent pattern. This is the
    # "explicitly-specifying levels of things" option vs. the reverse option of "freeform fields and
    # then inferring the level of specificity from the values".
    add_column :metadata, :specificity, :string
  end
end
