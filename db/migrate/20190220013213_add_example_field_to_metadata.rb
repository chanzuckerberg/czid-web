class AddExampleFieldToMetadata < ActiveRecord::Migration[5.1]
  EXAMPLES_ALL = {
    collection_date: ["2019", "2018"],
    collection_location: ["San Francisco, USA", "Uganda"],
    nucleotide_type: ["DNA", "RNA"],
    isolate: ["Yes", "No"],
    water_control: ["Yes", "No"],
    host_age: ["2", "28"],
    host_id: ["743", "PD-445"],
    host_sex: ["Male", "Female"],
    detection_method: ["PCR", "Plate cultures", "Agar slant", "Antigen testing"],
    infection_class: ["Definite", "No infection", "Suspected", "Unknown"],
    library_prep:
      ["NEB Ultra II FS DNA", "NEB Ultra II Directional RNA", "Nextera DNA"],
    sequencer: ["Illumina MiSeq", "Illumina HiSeq 2500", "Illumina NextSeq 500"],
    rna_dna_input: ["20", "30"],
    host_life_stage: ["Larva", "Nymph", "Adult"],
    blood_fed: ["Yes", "No", "Partially", "Mixed", "Unknown"],
    diseases_and_conditions: ["Meningoencephalitis", "Sepsis", "Interstitial pneumonia", "Tracheitis with inclusion bodies"]
  }.freeze

  EXAMPLES_HUMAN = {
    # TODO(mark): Assemble good sample_type examples for other hosts.
    sample_type: ["Bronchoalveolar lavage", "Cerebrospinal fluid", "Nasopharyngeal swab", "Plasma", "Stool"],
    # TODO(mark): Assemble good known_organism examples for other hosts.
    known_organism: ["MRSA", "Staphylococcus aureus", "Influenza", "Hepatitis C"],
    immunocomp: ["Host has HIV/AIDS", "Host has taken immunosuppressant drugs"],
    antibiotic_administered: ["Septrin", "Penicillin", "Eftriaxone"],
    host_race_ethnicity:
      ["Caucasian", "Asian", "African American", "American Indian", "Pacific Islander"],
    primary_diagnosis:
      ["Severe fever", "Pneumonia", "Septic shock during blood transfusion"],
    comorbidity: ["HIV", "Diabetes", "Asthma", "Cancer", "Cardiovascular disease", "COPD"]
  }.freeze

  EXAMPLES_MOSQUITO = {
    sample_type: ["Head", "Whole Mosquito", "Abdomen", "Salivary Glands", "Midgut"],
    host_genus_species: ["Aedes aegypti", "Culex erythrothorax", "Aedes sierrensis"],
    preservation_method: ["TEA", "Frozen", "CO2", "Dried"],
    sample_unit: ["1", "10"],
    trap_type: ["BG-Sentinel", "Gravid", "CDC light trap", "EVS/CO2", "Fay-Prince"],
    gravid: ["Yes", "No", "Mixed", "Unknown"]
  }.freeze

  def process_examples_add(examples, host_genome)
    examples.each do |key, value|
      field = MetadataField.where(name: key).first
      if field && field.host_genomes.find_by(name: host_genome)
        field.add_examples(value, host_genome)
      end
    end
  end

  def process_examples_remove(examples)
    examples.each do |key, _value|
      field = MetadataField.where(name: key).first
      if field && field.host_genomes.find_by(name: host_genome)
        field.update(examples: nil)
      end
    end
  end

  def up
    add_column :metadata_fields, :examples, :string

    process_examples_add(EXAMPLES_ALL, "all")
    process_examples_add(EXAMPLES_HUMAN, "Human")
    process_examples_add(EXAMPLES_MOSQUITO, "Mosquito")
  end

  def down
    process_examples_remove(EXAMPLES_ALL)
    process_examples_remove(EXAMPLES_HUMAN)
    process_examples_remove(EXAMPLES_MOSQUITO)

    remove_column :metadata_fields, :examples
  end
end
