class SeedMetadataFields < ActiveRecord::Migration[5.1]
  def up
    # TODO: All the validation_types, proper association with Metadata-data entries

    to_create = []

    to_create << MetadataField.new(
      name: "sample_type",
      display_name: "Sample Type",
      description: "Type of sample or tissue",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      is_required: 1,
      group: "Sample"
    )

    to_create << MetadataField.new(
      name: "nucleotide_type",
      display_name: "Nucleotide Type",
      description: "DNA or RNA",
      base_type: Metadatum::STRING_TYPE,
      options: %w[DNA RNA].to_s,
      force_options: 1,
      is_core: 1,
      is_default: 1,
      is_required: 1,
      group: "Sample"
    )

    to_create << MetadataField.new(
      name: "collection_date",
      display_name: "Collection Date",
      description: "Date sample was originally collected",
      base_type: Metadatum::DATE_TYPE,
      is_core: 1,
      is_default: 1,
      is_required: 1,
      group: "Sample"
    )

    to_create << MetadataField.new(
      name: "collection_location",
      display_name: "Collection Location",
      description: "Location sample was originally collected",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      is_required: 1,
      group: "Sample"
    )

    to_create.each do |m|
      unless MetadataField.find_by(name: m.name)
        m.save
      end
    end
  end

  def down
    MetadataField.delete_all
  end
end
