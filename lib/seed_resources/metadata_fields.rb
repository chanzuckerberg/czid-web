require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class MetadataFields < Base
    def seed
      # These data seeds are originally from the following migrations:
      # * db/migrate/20190116005251_seed_metadata_fields.rb
      # * db/migrate/20190123001644_associate_metadata_fields.rb

      ################################################
      ##### METADATA FIELDS FOR ALL HOST GENOMES #####
      ################################################
      all_host_genomes = HostGenome.all

      # In the original schema migrations, some metadata fields were associated with all host genomes that were in the
      # database at the time, but they are not associated with all host genomes in the seed data.
      host_genomes_for_non_default_fields = HostGenome.where(name: ["Human", "Mosquito", "Tick", "ERCC only", "Mouse", "Cat", "Pig"])

      FactoryBot.find_or_create(
        :metadata_field,
        name: "sample_type",
        display_name: "Sample Type",
        description: "Type of sample or tissue",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 1,
        group: "Sample",
        examples:
        "{\"1\":[\"Bronchoalveolar lavage\",\"Cerebrospinal fluid\",\"Nasopharyngeal swab\",\"Plasma\",\"Stool\"],\"2\":[\"Head\",\"Whole Mosquito\",\"Abdomen\",\"Salivary Glands\",\"Midgut\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "nucleotide_type",
        display_name: "Nucleotide Type",
        description: "DNA or RNA",
        base_type: 0,
        options: "[\"DNA\", \"RNA\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 1,
        group: "Sample",
        examples: "{\"all\":[\"DNA\",\"RNA\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "collection_date",
        display_name: "Collection Date",
        description: "Date sample was originally collected. For privacy reasons, only use month or year for human data in CZ ID.",
        base_type: 2,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 1,
        group: "Sample",
        examples: "{\"all\":[\"2019-01-01\",\"2019-01\",\"01/01/19\",\"01/2019\"],\"1\":[\"2019-01\",\"01/2019\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "collection_location",
        display_name: "Collection Location v1",
        description: "Location sample was originally collected. For privacy reasons, only use country, state, or county/sub-division for human data in IDseq.",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Sample",
        examples: "{\"all\":[\"California, USA\",\"Uganda\"]}",
        default_for_new_host_genome: 0,
        host_genomes: all_host_genomes
      )

      # Only associated with all host genomes at time of original migration
      FactoryBot.find_or_create(
        :metadata_field,
        name: "collected_by",
        display_name: "Collected By",
        description: "Collecting institution/agency",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 0,
        is_required: 0,
        group: "Sample",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: host_genomes_for_non_default_fields
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "host_sex",
        display_name: "Host Sex",
        description: "Sex of the host",
        base_type: 0,
        options: "[\"Female\", \"Male\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        examples: "{\"all\":[\"Male\",\"Female\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "known_organism",
        display_name: "Known Organism",
        description: "Organism detected by a clinical lab",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Infection",
        examples:
         "{\"1\":[\"MRSA\",\"Staphylococcus aureus\",\"Influenza\",\"Hepatitis C\"],\"1\":[\"MRSA\",\"Staphylococcus aureus\",\"Influenza\",\"Hepatitis C\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "infection_class",
        display_name: "Infection Class",
        description: "Information on the class of the infection",
        base_type: 0,
        options: "[\"Definite\", \"No Infection\", \"Suspected\", \"Unknown\", \"Water Control\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Infection",
        examples: "{\"all\":[\"Definite\",\"No infection\",\"Suspected\",\"Unknown\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "age",
        display_name: "age",
        description: nil,
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: nil,
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: all_host_genomes
      )

      # Only associated with all host genomes at time of original migration
      FactoryBot.find_or_create(
        :metadata_field,
        name: "other_infections",
        display_name: "Other Infections",
        description: "Information about infections at other sites",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Infection",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: host_genomes_for_non_default_fields
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "water_control",
        display_name: "Water Control",
        description: "Whether or not the sample is a water control",
        base_type: 0,
        options: "[\"Yes\", \"No\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 1,
        group: "Sample",
        examples: "{\"all\":[\"Yes\",\"No\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "isolate",
        display_name: "Isolate",
        description: "Whether or not the sample is an isolate",
        base_type: 0,
        options: "[\"Yes\", \"No\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Sample",
        examples: "{\"all\":[\"Yes\",\"No\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "diseases_and_conditions",
        display_name: "Diseases and Conditions",
        description: "Diseases or conditions observed in the host",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"all\":[\"Meningoencephalitis\",\"Sepsis\",\"Interstitial pneumonia\",\"Tracheitis with inclusion bodies\"]}",
        default_for_new_host_genome: 1
      )

      # Originally added and updated in the following migrations:
      # * db/migrate/20190521175543_add_new_collection_location.rb
      # * db/migrate/20190522175035_rename_new_location.rb
      FactoryBot.find_or_create(
        :metadata_field,
        name: "collection_location_v2",
        display_name: "Collection Location",
        description:
         "Location sample was originally collected. For privacy reasons, only use country, state, or county/sub-division for human data in CZ ID. If you enter a more specific location (e.g. city-level), we will only save up to the county-level information.",
        base_type: 3,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 1,
        group: "Sample",
        examples: nil,
        default_for_new_host_genome: 1
      )

      # Originally added in db/migrate/20210716210500_add_ct_value_metadata_field.rb
      FactoryBot.find_or_create(
        :metadata_field,
        name: "ct_value",
        display_name: "Ct Value",
        description:
         "The number of cycles required for the fluorescent signal to cross the background fluorescent threshold during qPCR. The value is inversely proportional to the amount of target nucleic acid.",
        base_type: 1,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Infection",
        examples: "{\"all\":[\"8\",\"14\",\"27\"]}",
        default_for_new_host_genome: 1
      )

      #################################################
      ##### METADATA FIELDS FOR HUMAN HOST GENOME #####
      #################################################
      # includes human genome from 2017-10-12 and
      human_genomes = HostGenome.where(name: "Human")

      # originally named "participant_id"
      FactoryBot.find_or_create(
        :metadata_field,
        name: "host_id",
        display_name: "Host ID",
        description: "Unique identifier for the host (e.g. for multiple samples from the same host)",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"all\":[\"743\",\"PD-445\"]}",
        default_for_new_host_genome: 0,
        host_genomes: human_genomes
      )

      # originally named "race"
      FactoryBot.find_or_create(
        :metadata_field,
        name: "host_race_ethnicity",
        display_name: "Host Race/Ethnicity",
        description: "Race/ethnicity of the host",
        base_type: 0,
        options: "[\"White\", \"Hispanic\", \"Black\", \"Asian\", \"Other\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples:
         "{\"1\":[\"Caucasian\",\"Asian\",\"African American\",\"American Indian\",\"Pacific Islander\"],\"1\":[\"Caucasian\",\"Asian\",\"African American\",\"American Indian\",\"Pacific Islander\"]}",
        default_for_new_host_genome: 0,
        host_genomes: human_genomes
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "primary_diagnosis",
        display_name: "Primary Diagnosis",
        description: "Diagnosed disease that resulted in hospital admission",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples:
         "{\"1\":[\"Severe fever\",\"Pneumonia\",\"Septic shock during blood transfusion\"],\"1\":[\"Severe fever\",\"Pneumonia\",\"Septic shock during blood transfusion\"]}",
        default_for_new_host_genome: 0,
        host_genomes: human_genomes
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "antibiotic_administered",
        display_name: "Antibiotic Administered",
        description: "Information on antibiotics administered to the host",
        base_type: 0,
        options: "[\"Yes\", \"No\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"1\":[\"Septrin\",\"Penicillin\",\"Eftriaxone\"],\"1\":[\"Septrin\",\"Penicillin\",\"Eftriaxone\"]}",
        default_for_new_host_genome: 0,
        host_genomes: human_genomes
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "immunocomp",
        display_name: "Immunocompromised",
        description: "Information on if the host was immunocompromised",
        base_type: 0,
        options: "[\"Yes\", \"No\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples:
         "{\"1\":[\"Host has HIV/AIDS\",\"Host has taken immunosuppressant drugs\"],\"1\":[\"Host has HIV/AIDS\",\"Host has taken immunosuppressant drugs\"]}",
        default_for_new_host_genome: 0,
        host_genomes: human_genomes
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "detection_method",
        display_name: "Detection Method",
        description: "Detection method for the known organism",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Infection",
        examples: "{\"all\":[\"PCR\",\"Plate cultures\",\"Agar slant\",\"Antigen testing\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "comorbidity",
        display_name: "Comorbidity",
        description: "Information on other chronic diseases present (e.g. HIV, Diabetes, COPD, etc.)",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples:
         "{\"1\":[\"HIV\",\"Diabetes\",\"Asthma\",\"Cancer\",\"Cardiovascular disease\",\"COPD\"],\"1\":[\"HIV\",\"Diabetes\",\"Asthma\",\"Cancer\",\"Cardiovascular disease\",\"COPD\"]}",
        default_for_new_host_genome: 0,
        host_genomes: human_genomes
      )

      ##########################################
      ##### METADATA FIELDS FOR SEQUENCING #####
      ##########################################

      FactoryBot.find_or_create(
        :metadata_field,
        name: "library_prep",
        display_name: "Library Prep",
        description: "Library prep kit information",
        base_type: 0,
        options: "[\"NEB Ultra II FS DNA\", \"NEB RNA Ultra II\", \"NEB Ultra II Directional RNA\", \"NEB Utra II DNA\", \"Nextera DNA\", \"Other\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Sequencing",
        examples: "{\"all\":[\"NEB Ultra II FS DNA\",\"NEB Ultra II Directional RNA\",\"Nextera DNA\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "sequencer",
        display_name: "Sequencer",
        description: "Sequencer information",
        base_type: 0,
        options: "[\"MiSeq\", \"NextSeq\", \"HiSeq\", \"NovaSeq\", \"Other\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Sequencing",
        examples: "{\"all\":[\"Illumina MiSeq\",\"Illumina HiSeq 2500\",\"Illumina NextSeq 500\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "rna_dna_input",
        display_name: "RNA/DNA Input (ng)",
        description: "RNA/DNA input in nanograms",
        base_type: 1,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Sequencing",
        examples: "{\"all\":[\"20\",\"30\"]}",
        default_for_new_host_genome: 1
      )

      ###############################################
      ##### METADATA FIELDS FOR MOSQUITO / TICK #####
      ###############################################

      # TODO: Add Mosquito genome to the host_genomes seed
      mosquito_genome = HostGenome.find_by(name: "Mosquito")
      tick_genome = HostGenome.find_by(name: "Tick")

      FactoryBot.find_or_create(
        :metadata_field,
        name: "host_life_stage",
        display_name: "Host Life Stage",
        description: "Life stage of the specimen",
        base_type: 0,
        options: "[\"Larva\", \"Nymph\", \"Adult\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"all\":[\"Larva\",\"Nymph\",\"Adult\"]}",
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome, tick_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "preservation_method",
        display_name: "Preservation Method",
        description: "Preservation method of the specimen",
        base_type: 0,
        options: "[\"TEA\", \"Freeze\", \"CO2\", \"Dried\", \"Other\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"2\":[\"TEA\",\"Frozen\",\"CO2\",\"Dried\"]}",
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "trap_type",
        display_name: "Trap Type",
        description: "Trap type used on the specimen",
        base_type: 0,
        options: "[\"BG-Sentinel\", \"Gravid\", \"CDC Light Trap\", \"EVS/CO2\", \"Fay-Prince\", \"Other\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"2\":[\"BG-Sentinel\",\"Gravid\",\"CDC light trap\",\"EVS/CO2\",\"Fay-Prince\"]}",
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "host_genus_species",
        display_name: "Host Genus Species",
        description: "Genus/species of the mosquito",
        base_type: 0,
        options:
         "[\"Aedes aegypti\", \"Culex erythrothorax\", \"Aedes sierrensis\", \"Anopheles punctipennis\", \"Anopheles freeborni\", \"Culex tarsalis\", \"Culex pipiens\", \"Aedes albopictus\", \"Other\"]",
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"2\":[\"Aedes aegypti\",\"Culex erythrothorax\",\"Aedes sierrensis\"]}",
        default_for_new_host_genome: 1
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "blood_fed",
        display_name: "Blood Fed",
        description: "Information about the mosquito's blood feeding",
        base_type: 0,
        options: "[\"Unfed\", \"Partially Blood Fed\", \"Blood Fed\", \"Gravid\", \"Gravid and Blood Fed\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"all\":[\"Yes\",\"No\",\"Partially\",\"Mixed\",\"Unknown\"]}",
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome, tick_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "sample_unit",
        display_name: "Sample Unit",
        description: "Number of mosquitoes in the sample that was sequenced",
        base_type: 1,
        options: nil,
        force_options: 0,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"2\":[\"1\",\"10\"]}",
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "unique_id",
        display_name: "Unique ID",
        description: "ID for the specimen (in case of multiple samples from the same specimen)",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Sample",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "collection_lat",
        display_name: "Collection Latitude",
        description: "Latitude of the original collection location",
        base_type: 1,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Sample",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "collection_long",
        display_name: "Collection Longitude",
        description: "Longitude of the original collection location",
        base_type: 1,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Sample",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "comp_id_genus",
        display_name: "Computed Genus",
        description: "Computationally-determined genus of the specimen",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Host",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "comp_id_species",
        display_name: "Computed Species",
        description: "Computationally-determined species of the specimen",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Host",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "reported_id_genus",
        display_name: "Reported Genus",
        description: "Reported/expected/human-identified genus of the specimen",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Host",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "reported_id_species",
        display_name: "Reported Species",
        description: "Reported/expected/human-identified species of the specimen",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Host",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "reported_sex",
        display_name: "Reported Sex",
        description: "Reported/expected/human-identified species of the specimen",
        base_type: 0,
        options: "[\"Female\", \"Male\"]",
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Host",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      # comp_sex was seeded in a migration, but is not present in the DB as of 2024-05

      FactoryBot.find_or_create(
        :metadata_field,
        name: "id_method",
        display_name: "Identification Method",
        description: "Identification method used",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Host",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "extraction_batch",
        display_name: "Extraction Batch",
        description: "Label for the extracted batch",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Sequencing",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "library_prep_batch",
        display_name: "Library Prep Batch",
        description: "Number given to library preparation from a group of samples",
        base_type: 0,
        options: nil,
        force_options: 0,
        is_core: 0,
        is_default: 0,
        is_required: 0,
        group: "Sequencing",
        examples: nil,
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )

      FactoryBot.find_or_create(
        :metadata_field,
        name: "gravid",
        display_name: "Gravid",
        description: "Whether or not the host(s) were gravid",
        base_type: 0,
        options: "[\"Yes\", \"No\", \"Mixed\", \"Unknown\"]",
        force_options: 1,
        is_core: 1,
        is_default: 1,
        is_required: 0,
        group: "Host",
        examples: "{\"2\":[\"Yes\",\"No\",\"Mixed\",\"Unknown\"]}",
        default_for_new_host_genome: 0,
        host_genomes: [mosquito_genome]
      )
    end
  end
end
