class UpdateMetadataFields < ActiveRecord::Migration[5.1]
  def up
    #########################
    # Create new fields
    #########################
    to_create = []

    to_create << MetadataField.new(
      name: "water_control",
      display_name: "Water Control",
      description: "Whether or not the sample is a water control",
      base_type: Metadatum::STRING_TYPE,
      options: ["Yes", "No"],
      force_options: 1,
      is_core: 1,
      is_default: 1,
      group: "Sample",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "isolate",
      display_name: "Isolate",
      description: "Whether or not the sample is an isolate",
      base_type: Metadatum::STRING_TYPE,
      options: ["Yes", "No"],
      force_options: 1,
      is_core: 1,
      is_default: 1,
      group: "Sample",
      host_genomes: HostGenome.all
    )

    if HostGenome.find_by(name: "Mosquito")
      to_create << MetadataField.new(
        name: "gravid",
        display_name: "Gravid",
        description: "Whether or not the host(s) were gravid",
        base_type: Metadatum::STRING_TYPE,
        options: ["Yes", "No", "Mixed", "Unknown"],
        force_options: 1,
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [HostGenome.find_by(name: "Mosquito")]
      )
    end

    mf = MetadataField.new(
      name: "diseases_and_conditions",
      display_name: "Diseases and Conditions",
      description: "Diseases or conditions observed in the host",
      base_type: Metadatum::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Host"
    )
    ["Mouse", "Cat", "Pig"].each do |h|
      mf.host_genomes << HostGenome.find_by(name: h) if HostGenome.find_by(name: h)
    end
    to_create << mf

    # Create the fields unless they already exist
    to_create.each do |m|
      m.save unless MetadataField.find_by(name: m.name)
    end

    #########################
    # Modify existing fields
    #########################

    # Replace 'participant' with 'host' in the description
    MetadataField.find_each { |field| field.update(description: field.description.gsub("participant", "host")) }

    mf = MetadataField.find_by(name: "participant_id")
    mf.update(name: "host_id", display_name: "Host ID") if mf

    mf = MetadataField.find_by(name: "blood_fed")
    hg = HostGenome.find_by(name: "Tick")
    mf.host_genomes << hg if mf && hg

    mf = MetadataField.find_by(name: "life_stage")
    mf.update(name: "host_life_stage", display_name: "Host Life Stage") if mf

    mf = MetadataField.find_by(name: "age")
    mf.update(name: "host_age", display_name: "Host Age", description: "Age of the host (default in years)") if mf

    mf = MetadataField.find_by(name: "sex")
    mf.update(name: "host_sex", display_name: "Host Sex", description: "Sex of the host") if mf

    mf = MetadataField.find_by(name: "genus_species")
    mf.update(name: "host_genus_species", display_name: "Host Genus Species") if mf

    # Assign all the fields on Cat to Pig (non-human defaults)
    if HostGenome.find_by(name: "Pig") && HostGenome.find_by(name: "Cat")
      HostGenome.find_by(name: "Pig").metadata_fields << HostGenome.find_by(name: "Cat").metadata_fields
    end

    #########################
    # Delete some fields. No undo but we had no data for these values.
    #########################
    to_delete = ["admission_date", "admission_type", "discharge_date", "discharge_type"]
    MetadataField.where(name: to_delete).delete_all
    Metadatum.where(key: to_delete).delete_all
  end

  def down
    # Opposite of everything (not perfect)

    MetadataField.where(name: ["water_control", "isolate", "gravid", "diseases_and_conditions"]).delete_all

    mf = MetadataField.find_by(name: "host_id")
    mf.update(name: "participant_id", display_name: "Participant ID") if mf

    mf = MetadataField.find_by(name: "blood_fed")
    hg = HostGenome.find_by(name: "Tick")
    mf.host_genomes.delete(hg) if mf && hg

    mf = MetadataField.find_by(name: "host_life_stage")
    mf.update(name: "life_stage", display_name: "Life Stage") if mf

    mf = MetadataField.find_by(name: "host_age")
    mf.update(name: "age", display_name: "Age") if mf

    mf = MetadataField.find_by(name: "host_sex")
    mf.update(name: "sex", display_name: "Sex") if mf

    mf = MetadataField.find_by(name: "host_genus_species")
    mf.update(name: "genus_species", display_name: "Genus Species") if mf

    hg = HostGenome.find_by(name: "Pig")
    hg.update(metadata_fields: []) if hg

    MetadataField.find_each { |field| field.update(description: field.description.gsub("host", "participant")) }

    human_genome = HostGenome.find_by(name: "Human")
    to_create = []
    to_create << MetadataField.new(
      name: "admission_date",
      display_name: "Admission Date",
      description: "Date the participant was admitted to the facility",
      base_type: Metadatum::DATE_TYPE,
      is_core: 1,
      group: "Host",
      host_genomes: [human_genome]
    )

    to_create << MetadataField.new(
      name: "admission_type",
      display_name: "Admission Type",
      description: "Type of admission to the facility (e.g. ICU)",
      base_type: Metadatum::STRING_TYPE,
      options: %w[ICU General],
      is_core: 1,
      group: "Host",
      host_genomes: [human_genome]
    )

    to_create << MetadataField.new(
      name: "discharge_date",
      display_name: "Discharge Date",
      description: "Date the participant was discharged or expired during the stay",
      base_type: Metadatum::DATE_TYPE,
      is_core: 1,
      group: "Host",
      host_genomes: [human_genome]
    )

    to_create << MetadataField.new(
      name: "discharge_type",
      display_name: "Discharge Type",
      description: "Type of discharge",
      base_type: Metadatum::STRING_TYPE,
      options: ["ICU", "Hospital", "30-Day Mortality", "Other"],
      is_core: 1,
      group: "Host",
      host_genomes: [human_genome]
    )

    to_create.each do |m|
      m.save unless MetadataField.find_by(name: m.name)
    end
  end
end
