# NOTE: we should probably be using seeds.rb instead of migrations for initializing data.
class SeedMetadataFields < ActiveRecord::Migration[5.1]
  def up
    # TODO: All the validation_types, proper association with Metadata-data entries, project associations, etc.

    # +----------------------+
    # |   All/custom fields  |
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
    # t.integer :is_core

    # Default fields are a subset of the core fields that will appear on a project when someone
    # creates a project. These can be removed from a project.
    # t.integer :is_default

    # Required fields are a subset of the core/default fields that cannot be removed from the
    # project. This is the strictest level. Ex: collection_date, location, nucleotide_type, etc.
    # t.integer :is_required

    to_create = []

    ############################
    ##### ALL HOST GENOMES #####
    ############################

    to_create << MetadataField.new(
      name: "sample_type",
      display_name: "Sample Type",
      description: "Type of sample or tissue",
      base_type: MetadataField::STRING_TYPE,
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
      base_type: MetadataField::STRING_TYPE,
      options: %w[DNA RNA],
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
      base_type: MetadataField::DATE_TYPE,
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
      base_type: MetadataField::STRING_TYPE,
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
      base_type: MetadataField::STRING_TYPE,
      is_core: 1,
      group: "Sample",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "sex",
      display_name: "Sex",
      description: "Sex of the host/participant/specimen",
      base_type: MetadataField::STRING_TYPE,
      options: %w[Female Male],
      force_options: 1,
      is_core: 1,
      is_default: 1,
      group: "Host",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "known_organism",
      display_name: "Known Organism",
      description: "Organism detected by a clinical lab",
      base_type: MetadataField::STRING_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Infection",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "infection_class",
      display_name: "Infection Class",
      description: "Information on the class of the infection",
      base_type: MetadataField::STRING_TYPE,
      options: ["Definite", "No Infection", "Suspected", "Unknown", "Water Control"],
      force_options: 1,
      is_core: 1,
      is_default: 1,
      group: "Infection",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "age",
      display_name: "Age",
      description: "Age of the host/participant (by default in years)",
      base_type: MetadataField::NUMBER_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Host",
      host_genomes: HostGenome.all
    )

    ########################
    ##### HUMAN FIELDS #####
    ########################

    human_genome = HostGenome.find_by(name: "Human")
    if human_genome
      to_create << MetadataField.new(
        name: "participant_id",
        display_name: "Participant ID",
        description: "Unique identifier for the participant (e.g. for multiple samples from the same participant)",
        base_type: MetadataField::STRING_TYPE,
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "race",
        display_name: "Race/Ethnicity",
        description: "Race/ethnicity of the participant",
        base_type: MetadataField::STRING_TYPE,
        options: %w[White Hispanic Black Asian Other],
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "primary_diagnosis",
        display_name: "Primary Diagnosis",
        description: "Diagnosed disease that resulted in hospital admission",
        base_type: MetadataField::STRING_TYPE,
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "admission_date",
        display_name: "Admission Date",
        description: "Date the participant was admitted to the facility",
        base_type: MetadataField::DATE_TYPE,
        is_core: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "admission_type",
        display_name: "Admission Type",
        description: "Type of admission to the facility (e.g. ICU)",
        base_type: MetadataField::STRING_TYPE,
        options: %w[ICU General],
        is_core: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "discharge_date",
        display_name: "Discharge Date",
        description: "Date the participant was discharged or expired during the stay",
        base_type: MetadataField::DATE_TYPE,
        is_core: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "discharge_type",
        display_name: "Discharge Type",
        description: "Type of discharge",
        base_type: MetadataField::STRING_TYPE,
        options: ["ICU", "Hospital", "30-Day Mortality", "Other"],
        is_core: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "antibiotic_administered",
        display_name: "Antibiotic Administered",
        description: "Information on antibiotics administered to the participant",
        base_type: MetadataField::STRING_TYPE,
        options: %w[Yes No],
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "immunocomp",
        display_name: "Immunocompromised",
        description: "Information on if the participant was immunocompromised",
        base_type: MetadataField::STRING_TYPE,
        options: %w[Yes No],
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "detection_method",
        display_name: "Detection Method",
        description: "Detection method for the known organism",
        base_type: MetadataField::STRING_TYPE,
        is_core: 1,
        is_default: 1,
        group: "Infection",
        host_genomes: [human_genome]
      )

      to_create << MetadataField.new(
        name: "comorbidity",
        display_name: "Comorbidity",
        description: "Information on other chronic diseases present (e.g. HIV, Diabetes, COPD, etc.)",
        base_type: MetadataField::STRING_TYPE,
        is_core: 1,
        is_default: 1,
        group: "Infection",
        host_genomes: [human_genome]
      )
    end

    ######################
    ##### SEQUENCING #####
    ######################

    to_create << MetadataField.new(
      name: "library_prep",
      display_name: "Library Prep",
      description: "Library prep kit information",
      base_type: MetadataField::STRING_TYPE,
      options: ["NEB Ultra II FS DNA", "NEB RNA Ultra II", "NEB Ultra II Directional RNA", "NEB Utra II DNA", "Nextera DNA", "Other"],
      is_core: 1,
      is_default: 1,
      group: "Sequencing",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "sequencer",
      display_name: "Sequencer",
      description: "Sequencer information",
      base_type: MetadataField::STRING_TYPE,
      options: %w[MiSeq NextSeq HiSeq NovaSeq Other],
      is_core: 1,
      is_default: 1,
      group: "Sequencing",
      host_genomes: HostGenome.all
    )

    to_create << MetadataField.new(
      name: "rna_dna_input",
      display_name: "RNA/DNA Input (ng)",
      description: "RNA/DNA input in nanograms",
      base_type: MetadataField::NUMBER_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Sequencing",
      host_genomes: HostGenome.all
    )

    ###########################
    ##### MOSQUITO / TICK #####
    ###########################

    mosquito_genome = HostGenome.find_by(name: "Mosquito")
    if mosquito_genome
      if HostGenome.find_by(name: "Tick")
        to_create << MetadataField.new(
          name: "life_stage",
          display_name: "Life Stage",
          description: "Life stage of the specimen",
          base_type: MetadataField::STRING_TYPE,
          options: %w[Larva Nymph Adult],
          force_options: 1,
          is_core: 1,
          is_default: 1,
          group: "Host",
          host_genomes: [mosquito_genome, HostGenome.find_by(name: "Tick")]
        )
      end

      to_create << MetadataField.new(
        name: "preservation_method",
        display_name: "Preservation Method",
        description: "Preservation method of the specimen",
        base_type: MetadataField::STRING_TYPE,
        options: %w[TEA Freeze CO2 Dried Other],
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "trap_type",
        display_name: "Trap Type",
        description: "Trap type used on the specimen",
        base_type: MetadataField::STRING_TYPE,
        options: ["BG-Sentinel", "Gravid", "CDC Light Trap", "EVS/CO2", "Fay-Prince", "Other"],
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "genus_species",
        display_name: "Genus/Species",
        description: "Genus/species of the mosquito",
        base_type: MetadataField::STRING_TYPE,
        options: ["Aedes aegypti", "Culex erythrothorax", "Aedes sierrensis", "Anopheles punctipennis", "Anopheles freeborni", "Culex tarsalis", "Culex pipiens", "Aedes albopictus", "Other"],
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "blood_fed",
        display_name: "Blood Fed",
        description: "Information about the mosquito's blood feeding",
        base_type: MetadataField::STRING_TYPE,
        options: ["Unfed", "Partially Blood Fed", "Blood Fed", "Gravid", "Gravid and Blood Fed"],
        force_options: 1,
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "sample_unit",
        display_name: "Sample Unit",
        description: "Number of mosquitoes in the sample that was sequenced",
        base_type: MetadataField::NUMBER_TYPE,
        is_core: 1,
        is_default: 1,
        group: "Host",
        host_genomes: [mosquito_genome]
      )
    end

    # Create the fields unless they already exist
    to_create.each do |m|
      unless MetadataField.find_by(name: m.name)
        m.save
      end
    end

    # Each project gets a reference copy of the set of "default" fields
    default_fields = MetadataField.where(is_default: 1)
    Project.all.each do |p|
      # Bulk insertions for efficiency
      values = default_fields.map { |f| "(#{p.id}, #{f.id})" }.join(",")
      ActiveRecord::Base.connection.execute("INSERT INTO metadata_fields_projects (project_id, metadata_field_id) VALUES #{values}")
    end
  end

  def down
    MetadataField.delete_all
  end
end
