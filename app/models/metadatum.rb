class Metadatum < ApplicationRecord
  include PipelineOutputsHelper

  # ActiveRecord related
  belongs_to :sample
  STRING_TYPE = 0
  NUMBER_TYPE = 1
  # When using an ActiveRecord enum, the type returned from reading records is String.
  enum data_type: { string: STRING_TYPE, number: NUMBER_TYPE }
  validates :text_validated_value, length: { maximum: 250 }
  validates :number_raw_value, :number_validated_value, numericality: true, allow_nil: true
  validate :set_validated_values

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
    unless key && KEY_TO_TYPE.key?(key.to_sym)
      errors.add(:key, "#{key} is not a supported metadatum")
    end

    if data_type == "number"
      # Set number types. ActiveRecord validated.
      self.number_validated_value = number_raw_value
    elsif data_type == "string"
      check_and_set_string_type
    end
  end

  # Called by set_validated_values custom validator
  def check_and_set_string_type
    key = self.key.to_sym
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
        errors.add(:text_raw_value, "#{text_raw_value} did not match options #{options.join(', ')}")
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

  def self.add_or_update_on_sample(sample, key, _raw_value)
    sample.metadata.find_by(key.to_s)
  end

  def str_to_basic_chars(res)
    res.downcase.gsub(/[^0-9A-Za-z]/, '')
  end

  def self.load_csv_from_s3(path)
    # Return all the errors at the end to present consolidated feedback.
    errors = []

    csv_data = get_s3_file(path)
    # Remove BOM if present (file likely comes from Excel)
    csv_data.delete!("\uFEFF")

    CSV.parse(csv_data, headers: true).each_with_index do |row, index|
      errors += load_csv_single_sample_row(row, index)
    end
  end

  def self.load_csv_single_sample_row(row, index)
    errors = []
    row = row.to_h

    # Get project name
    proj_name = row['study_id'] || row['project_name']
    unless proj_name
      errors << "No project name found in row #{index + 1}"
      return errors
    end
    proj = Project.find_by(name: proj_name)
    unless proj
      errors << "No project found named #{proj_name}"
      return errors
    end

    # Get sample name
    sample_name = row['sample_name']
    unless sample_name
      errors << "No sample name found in row #{index + 1}"
      return errors
    end
    sample = Sample.find_by(project_id: proj, name: sample_name)
    unless sample
      errors << "No sample found named #{sample_name} in #{proj_name}"
      return errors
    end

    # Add or update Metadata items
    row.each do |key, value|
      if !key || !value || key == 'sample_name' || key == 'project_name'
        next
      end
    end

    new_details = {}
    new_details['sample_notes'] = sampl.sample_notes || ''
    row.each do |key, value|
      if !key || !value || key == 'sample_name' || key == 'project_name'
        next
      end
      if Sample::METADATA_FIELDS.include?(key.to_sym)
        new_details[key] = value
      else # Otherwise throw in notes
        new_details['sample_notes'] << format("\n- %s: %s", key, value)
      end
    end
    new_details['sample_notes'].strip!
    sampl.update_attributes!(new_details)
  end
end
