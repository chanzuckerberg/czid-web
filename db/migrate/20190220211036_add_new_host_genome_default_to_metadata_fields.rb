class AddNewHostGenomeDefaultToMetadataFields < ActiveRecord::Migration[5.1]
  DEFAULTS = [
    "collection_date",
    "collection_location",
    "nucleotide_type",
    "sample_type",
    "water_control",
    "isolate",
    "host_genus_species",
    "host_sex",
    "infection_class",
    "known_organism",
    "detection_method",
    "library_prep",
    "sequencer",
    "rna_dna_input",
    # The following fields are important for most species, but might not apply to ALL.
    "host_age", # For some hosts like ticks, host_life_stage might be more relevant.
    "diseases_and_conditions" # Might not apply to disease vectors such as mosquitoes and ticks.
  ].freeze

  def up
    add_column :metadata_fields, :default_for_new_host_genome, :integer, limit: 1, default: 0
    DEFAULTS.each do |key|
      field = MetadataField.find_by(name: key)
      if field
        field.update(default_for_new_host_genome: 1)
      end
    end
  end

  def down
    remove_column :metadata_fields, :default_for_new_host_genome
  end
end
