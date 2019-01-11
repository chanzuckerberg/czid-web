require 'csv'

class Metadatum < ApplicationRecord
  Client = Aws::S3::Client.new

  # ActiveRecord related
  belongs_to :sample
  # TODO: metadata_field type will be required after migration.
  belongs_to :metadata_field, optional: true
  STRING_TYPE = 0
  NUMBER_TYPE = 1
  DATE_TYPE = 2

  # When using an ActiveRecord enum, the type returned from reading records is String.
  enum data_type: { string: STRING_TYPE, number: NUMBER_TYPE, date: DATE_TYPE }

  # Validations
  validates :string_validated_value, length: { maximum: 250 }
  validates :number_validated_value, numericality: true, allow_nil: true
  validate :set_validated_values

  # Additional ActiveRecord field documentation:
  #
  # For things like location/date we should try to have a consistent pattern. This is the
  # "explicitly-specifying levels of things" option vs. the reverse option of "freeform fields and
  # then inferring the level of specificity from the values".
  # t.string :specificity
  #
  # Every piece of metadata will belong to a type of metadata_field
  # add_reference :metadata, :metadata_field

  # Key to the metadatum type. Supporting strings and numbers currently.
  KEY_TO_TYPE = {
    unique_id: STRING_TYPE,
    sample_type: STRING_TYPE,
    nucleotide_type: STRING_TYPE,
    collection_date: DATE_TYPE,
    collection_location: STRING_TYPE,
    collected_by: STRING_TYPE,
    age: NUMBER_TYPE,
    gender: STRING_TYPE,
    race: STRING_TYPE,
    primary_diagnosis: STRING_TYPE,
    antibiotic_administered: STRING_TYPE,
    admission_date: DATE_TYPE,
    admission_type: STRING_TYPE,
    discharge_date: DATE_TYPE,
    discharge_type: STRING_TYPE,
    immunocomp: STRING_TYPE,
    other_infections: STRING_TYPE,
    comorbidity: STRING_TYPE,
    known_organism: STRING_TYPE,
    infection_class: STRING_TYPE,
    detection_method: STRING_TYPE,
    library_prep: STRING_TYPE,
    sequencer: STRING_TYPE,
    rna_dna_input: NUMBER_TYPE,
    library_prep_batch: STRING_TYPE,
    extraction_batch: STRING_TYPE,
    sample_unit: NUMBER_TYPE,
    life_stage: STRING_TYPE,
    id_method: STRING_TYPE,
    genus_species: STRING_TYPE,
    preservation_method: STRING_TYPE,
    trap_type: STRING_TYPE,
    blood_fed: STRING_TYPE,
    reported_sex: STRING_TYPE,
    comp_sex: STRING_TYPE,
    # TODO(mark): Have a single more robust location type.
    collection_lat: NUMBER_TYPE,
    collection_long: NUMBER_TYPE,
    reported_id_genus: STRING_TYPE,
    reported_id_species: STRING_TYPE,
    comp_id_genus: STRING_TYPE,
    comp_id_species: STRING_TYPE
  }.freeze

  # Key to the valid string options.
  KEY_TO_STRING_OPTIONS = {
    nucleotide_type: %w[DNA RNA],
    gender: %w[Female Male],
    race: ["Caucasian", "Asian", "African American", "Other"],
    admission_type: %w[ICU General],
    discharge_type: ["ICU", "Hospital", "30 Day Mortality", "Other"],
    infection_class: ["Definite", "No Infection", "Suspected", "Unknown", "Water Control"],
    library_prep: ["NEB Ultra II FS DNA", "NEB RNA Ultra II", "NEB Ultra II Directional RNA", "NEB Utra II DNA", "Nextera DNA", "Other"],
    sequencer: %w[MiSeq NextSeq HiSeq NovaSeq Other]
  }.freeze

  # Valid string options that apply ONLY TO MOSQUITOES. (short-term special case)
  MOSQUITO_KEY_TO_STRING_OPTIONS = {
    life_stage: ["Larva", "Nymph", "Adult"],
    reported_sex: ["Male", "Female"],
    comp_sex: ["Male", "Female"]
  }.freeze
  # Mapping from alternative name to our name. Used at upload time.
  KEY_ALT_NAMES = {
    sample_unique_id: "unique_id",
    sample_collection_date: "collection_date",
    sample_collection_location: "collection_location",
    :"rna/dna_input(ng)" => "rna_dna_input",
    :"rna/dna_input (ng)" => "rna_dna_input",
    :"rna/dna_input" => "rna_dna_input",
    :"rna/dna input" => "rna_dna_input",
    :"rna/dna input (ng)" => "rna_dna_input",
    antibiotics_administered: "antibiotic_administered",
    :"known_organism(s)" => "known_organism",
    :known_organisms => "known_organism"
  }.freeze

  KEY_TO_DISPLAY_NAME = {
    unique_id: "Sample Unique ID",
    sample_type: "Sample Type",
    nucleotide_type: "Nucleotide Type",
    collection_date: "Sample Collection Date",
    collection_location: "Sample Collection Location",
    collected_by: "Collected By",
    age: "Age",
    gender: "Sex",
    race: "Race",
    primary_diagnosis: "Primary Diagnosis",
    antibiotic_administered: "Antibiotic Administered",
    admission_date: "Admission Date",
    admission_type: "Admission Type",
    discharge_date: "Discharge Date",
    discharge_type: "Discharge Type",
    immunocomp: "Immunocomp",
    other_infections: "Other Infections",
    comorbidity: "Comorbidity",
    known_organism: "Known Organism",
    infection_class: "Infection Class",
    detection_method: "Detection Method",
    library_prep: "Library Prep",
    sequencer: "Sequencer",
    rna_dna_input: "RNA / DNA Input (ng)",
    library_prep_batch: "Library Prep Batch",
    extraction_batch: "Extraction Batch",
    sample_unit: "Sample Unit",
    life_stage: "Life Stage",
    id_method: "ID Method",
    genus_species: "Genus/Species",
    preservation_method: "Preservation Method",
    trap_type: "Trap Type",
    blood_fed: "Blood Fed",
    reported_sex: "Reported Sex",
    comp_sex: "Computed Sex",
    reported_id_genus: "Reported Genus",
    reported_id_species: "Reported Species",
    comp_id_genus: "Computed Genus",
    comp_id_species: "Computed Species",
    collection_lat: "Collection Latitude",
    collection_long: "Collection Longitude"
  }.freeze

  HOST_GENOME_NAME_TO_METADATA_KEYS = {
    common: %w[
      unique_id
      sample_type
      nucleotide_type
      collection_date
      collected_by
      known_organism
      detection_method
      library_prep
      sequencer
      rna_dna_input
      library_prep_batch
      extraction_batch
    ],
    Human: %w[
      collection_location
      age
      gender
      race
      primary_diagnosis
      antibiotic_administered
      admission_date
      admission_type
      discharge_date
      discharge_type
      immunocomp
      other_infections
      comorbidity
      infection_class
    ],
    # Collection location is here (in addition to collection_lat/collection_long) as a temporary fix.
    # Collection_location is hard-coded as a default in the front-end, for example in the heatmap.
    # TODO(mark): Refactor front-end to be more resilient to custom metadata schemas, and remove this duplication.
    Mosquito: %w[
      collection_location
      collection_lat
      collection_long
      reported_sex
      comp_sex
      sample_unit
      life_stage
      preservation_method
      trap_type
      blood_fed
      reported_id_genus
      reported_id_species
      comp_id_genus
      comp_id_species
    ],
    default: %w[
      collection_location
      gender
      life_stage
      id_method
      genus_species
    ]
  }.freeze

  # Custom validator called on save or update. Writes to the *_validated_value column.
  def set_validated_values
    # Check if the key is valid
    valid_keys = self.class.valid_keys_by_host_genome_name(sample.host_genome_name)
    unless key && valid_keys.include?(key)
      errors.add(:key, "#{key} is not a supported metadatum for host genome #{sample.host_genome_name}")
      return
    end

    if data_type
      public_send("check_and_set_#{data_type}_type")
    end
  end

  # Called by set_validated_values custom validator
  def check_and_set_string_type
    key = self.key.to_sym

    options = self.class.get_string_options(key, sample.host_genome_name)

    if options
      # If there are explicit string options, match the value to one of them.
      matched = false
      options.each do |opt|
        if Metadatum.str_to_basic_chars(raw_value) == Metadatum.str_to_basic_chars(opt)
          # Ex: Match 'neb ultra-iifs dna' to 'NEB Ultra II FS DNA'
          # Ex: Match '30-day mortality' to "30 Day Mortality"
          self.string_validated_value = opt
          matched = true
          break
        end
      end
      unless matched
        errors.add(:raw_value, "#{raw_value} did not match options #{options.join(', ')}")
      end
    else
      self.string_validated_value = raw_value
    end
  end

  def check_and_set_number_type
    # If the raw-value doesn't match a number regex.
    # This regex matches things like +0.2. Plus or minus, one or more digits, an optional decimal, and more digits.
    if /\A[+-]?\d+(\.\d+)?\z/.match(raw_value).nil?
      errors.add(:raw_value, "#{raw_value} is not a valid number")
    else
      # to_f will convert "abc" to 0.0, so we need the regex
      self.number_validated_value = raw_value.to_f
    end
  rescue ArgumentError
    errors.add(:raw_value, "#{raw_value} is not a valid number")
  end

  def check_and_set_date_type
    self.date_validated_value = Date.parse(raw_value)
  rescue ArgumentError
    errors.add(:raw_value, "#{raw_value} is not a valid date")
  end

  def self.str_to_basic_chars(res)
    res.downcase.gsub(/[^0-9A-Za-z]/, '')
  end

  # Load bulk metadata from a CSV file from S3
  def self.bulk_load_from_s3_csv(path)
    csv_data = get_s3_csv(path)
    to_create, errors = bulk_load_prepare(csv_data)
    errors += bulk_load_import(to_create)
    bulk_log_errors(errors)
  end

  # Construct objects to create without saving.
  def self.bulk_load_prepare(csv_data)
    to_create = []
    errors = []
    csv_data.each_with_index do |row, index|
      begin
        to_create += load_csv_single_sample_row(row, index)
      rescue => err
        # Catch ArgumentError for proj and sample, other errors
        errors << err.message
      end
    end
    [to_create, errors]
  end

  # Create the object instances with activerecord-import. Still uses the
  # validations.
  def self.bulk_load_import(to_create)
    errors = []
    begin
      # The unique key is on sample and metadata.key, so the value fields will
      # be updated if the key exists.
      update_keys = [:raw_value, :string_validated_value, :number_validated_value, :date_validated_value]
      results = Metadatum.import to_create, on_duplicate_key_update: update_keys
      results.failed_instances.each do |model|
        # Show the errors from ActiveRecord
        msg = model.errors.full_messages[0]
        errors << "#{model.key}: #{msg}"
      end
    rescue => err
      # Record other errors
      errors << err.message
    end
    errors
  end

  def self.bulk_log_errors(errors)
    unless errors.empty?
      msg = errors.join(".\n")
      Rails.logger.error(msg)
      errors
    end
  end

  # Load CSV file from S3. Raise RuntimeError on download fail.
  def self.get_s3_csv(path)
    parts = path.split("/", 4)
    bucket = parts[2]
    key = parts[3]
    begin
      resp = Client.get_object(bucket: bucket, key: key)
      csv_data = resp.body.read
    rescue => err
      raise "Error in loading S3 file. #{err.message}"
    end

    # Remove BOM if present (file likely comes from Excel)
    csv_data = csv_data.delete("\uFEFF")
    csv_data = CSV.parse(csv_data, headers: true)
    csv_data
  end

  # Load metadata from a single CSV row corresponding to one sample.
  # Return the Metadatum to create without saving.
  def self.load_csv_single_sample_row(row, index)
    # Setup
    to_create = []
    row = row.to_h
    proj = load_csv_project(row, index)
    sample = load_csv_sample(row, index, proj)

    # Add or update Metadata items
    done_keys = [:study_id, :project_name, :sample_name]
    row.each do |key, value|
      next unless key && value
      # Strip whitespace and ensure symbol
      key = key.to_s.strip.to_sym
      next if done_keys.include?(key)
      # Translate alternative names
      if KEY_ALT_NAMES.include?(key)
        key = KEY_ALT_NAMES[key]
      end
      to_create << new_without_save(sample, key, value)
    end

    to_create
  end

  # Get the project for the CSV row
  def self.load_csv_project(row, index)
    proj_name = row['study_id'] || row['project_name']
    unless proj_name
      raise ArgumentError, "No project name found in row #{index + 2}"
    end
    proj = Project.find_by(name: proj_name)
    unless proj
      raise ArgumentError, "No project found named #{proj_name}"
    end
    proj
  end

  # Get the sample for the CSV row
  def self.load_csv_sample(row, index, proj)
    sample_name = row['sample_name']
    unless sample_name
      raise ArgumentError, "No sample name found in row #{index + 2}"
    end
    sample = Sample.find_by(project: proj, name: sample_name)
    unless sample
      raise ArgumentError, "No sample found named #{sample_name} in #{proj.name}"
    end
    sample
  end

  # Make a new Metadatum instance without saving/creating.
  def self.new_without_save(sample, key, value)
    key = key.to_sym
    m = Metadatum.new
    m.key = key
    m.data_type = KEY_TO_TYPE[key]
    m.raw_value = value
    # *_validated_value field is set in the set_validated_values validator.
    m.sample = sample
    m
  end

  def validated_value
    return self["#{data_type}_validated_value"]
  rescue
    ""
  end

  def self.convert_type_to_string(type)
    if type == STRING_TYPE
      return "string"
    elsif type == NUMBER_TYPE
      return "number"
    elsif type == DATE_TYPE
      return "date"
    end
    ""
  end

  def self.valid_keys_by_host_genome_name(host_genome_name)
    metadata_map = HOST_GENOME_NAME_TO_METADATA_KEYS

    valid_keys = if host_genome_name && metadata_map.key?(host_genome_name.to_sym)
                   metadata_map[:common] + metadata_map[host_genome_name.to_sym]
                 else
                   metadata_map[:common] + metadata_map[:default]
                 end

    valid_keys
  end

  def self.get_string_options(key_sym, host_genome_name)
    if host_genome_name == "Mosquito" && Metadatum::MOSQUITO_KEY_TO_STRING_OPTIONS.key?(key_sym)
      return Metadatum::MOSQUITO_KEY_TO_STRING_OPTIONS[key_sym]
    end
    if Metadatum::KEY_TO_STRING_OPTIONS.key? key_sym
      return Metadatum::KEY_TO_STRING_OPTIONS[key_sym]
    end
    nil
  end
end
