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
      group: "Sample",
      host_genomes: HostGenome.all
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
      group: "Sample",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "collection_date",
      display_name: "Collection Date",
      description: "Date sample was originally collected",
      base_type: Metadatum::DATE_TYPE,
      is_core: 1,
      is_default: 1,
      is_required: 1,
      group: "Sample",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "collection_location",
      display_name: "Collection Location",
      description: "Location sample was originally collected",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      is_required: 1,
      group: "Sample",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "collected_by",
      display_name: "Collected By",
      description: "Collecting institution/agency",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      group: "Sample",
      host_genomes: HostGenome.all
    )

    # HUMAN FIELDS

    to_create << MetadataField.new(
      name: "participant_id",
      display_name: "Participant ID",
      description: "Unique identifier for the participant (e.g. for multiple samples from the same participant)",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "age",
      display_name: "Age",
      description: "Age of the participant",
      base_type: Metadatum::NUMBER_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "sex",
      display_name: "Sex",
      description: "Sex of the participant",
      base_type: Metadatum::STRING_TYPE,
      options: %w[Female Male].to_s,
      force_options: 1,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "race",
      display_name: "Race/Ethnicity",
      description: "Race/ethnicity of the participant",
      base_type: Metadatum::STRING_TYPE,
      options: %w[White Hispanic Black Asian Other].to_s,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "primary_diagnosis",
      display_name: "Primary Diagnosis",
      description: "Diagnosed disease that resulted in hospital admission",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "admission_date",
      display_name: "Admission Date",
      description: "Date the patient was admitted to the facility",
      base_type: Metadatum::DATE_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "admission_type",
      display_name: "Admission Type",
      description: "Type of admission to the facility (e.g. ICU)",
      base_type: Metadatum::STRING_TYPE,
      options: %w[ICU General].to_s,
      is_core: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "discharge_date",
      display_name: "Discharge Date",
      description: "Date the patient was discharged or expired during the stay",
      base_type: Metadatum::DATE_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
    )

    to_create << MetadataField.new(
      name: "discharge_type",
      display_name: "Discharge Type",
      description: "Type of discharge",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Participant",
      host_genomes: HostGenome.find_by(name: "Human")
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
