class Metadatum < ApplicationRecord
  # ActiveRecord related
  belongs_to :sample
  enum data_type: [:string, :number]
  validates :text_validated_value, length: { maximum: 250 }
  validates :number_raw_value, :number_validated_value, numericality: true, allow_nil: true
  validate :set_validated_values

  STRING_TYPE = 0
  NUMBER_TYPE = 1
  # Key to the metadatum type. Supporting strings and numbers currently.
  KEY_TO_TYPE = {
    unique_id: STRING_TYPE,
    sample_type: STRING_TYPE,
    nucleotide_type: STRING_TYPE,
    collection_date: STRING_TYPE,
    collection_location: STRING_TYPE,
    collected_by: STRING_TYPE,
    age: NUMBER_TYPE,
    gender: STRING_TYPE,
    race: STRING_TYPE,
    primary_diagnosis: STRING_TYPE,
    antibiotic_administered: STRING_TYPE,
    admission_date: STRING_TYPE,
    admission_type: STRING_TYPE,
    discharge_date: STRING_TYPE,
    discharge_type: STRING_TYPE,
    immunocomp: STRING_TYPE,
    other_infections: STRING_TYPE,
    comorbitity: STRING_TYPE,
    known_organism: STRING_TYPE,
    infection_class: STRING_TYPE,
    detection_method: STRING_TYPE,
    library_prep: STRING_TYPE,
    sequencer: STRING_TYPE,
    rna_dna_input: NUMBER_TYPE,
    library_prep_batch: STRING_TYPE,
    extraction_batch: STRING_TYPE
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

  # Custom validator called on save or update. Writes to the *_validated_value column.
  def set_validated_values
    # Check if the key is valid
    errors.add(:key, "not a supported metadatum") unless KEY_TO_TYPE.key?(key)

    if data_type == NUMBER_TYPE
      # Set number types. ActiveRecord validated.
      self.number_validated_value = number_raw_value
    elsif data_type == STRING_TYPE
      check_and_set_string_type
    end
    save
  end

  # Called by set_validated_values custom validator
  def check_and_set_string_type
    if KEY_TO_STRING_OPTIONS.key?(key)
      # If there are explicit string options, match the value to one of them.
      matched = false
      options = KEY_TO_STRING_OPTIONS[key]
      options.each do |opt|
        if str_to_basic_chars(text_raw_value) == str_to_basic_chars(opt)
          # Ex: Match 'neb ultra-iifs dna' to 'NEB Ultra II FS DNA'
          # Ex: Match '30-day mortality' to "30 Day Mortality"
          self.text_validated_value = opt
          matched = true
          break
        end
      end
      unless matched
        errors.add(:text_raw_value, "did not match options #{options.join(', ')}")
      end
    else
      self.text_validated_value = text_raw_value
    end
  end

  # Add a new Metadatum entry to the sample
  def self.add_to_sample(sample, key, raw_value)
    key = key.to_sym

    # Create the entry
    m = Metadatum.new
    m.key = key
    m.data_type = KEY_TO_TYPE[key]
    if KEY_TO_TYPE[key] == STRING_TYPE
      m.text_raw_value = raw_value
    elsif KEY_TO_TYPE[key] == NUMBER_TYPE
      m.number_raw_value = raw_value
    end
    # *_validated_value field is set in the set_validated_values validator.
    m.sample = sample
    m.save!
  end

  def self.str_to_basic_chars(res)
    res.downcase.gsub(/[^0-9A-Za-z]/, '')
  end
end
