class Metadatum < ApplicationRecord
  belongs_to :sample

  # Types: 0 for string, 1 for number, 2 for lists of values (as string)
  KEY_TO_TYPE = { unique_id: 0, sample_type: 0, nucleotide_type: 0, collection_date: 0, collection_location: 0, collected_by: 0, age: 1, gender: 0, race: 0, primary_diagnosis: 0, antibiotic_administered: 0, admission_date: 0, admission_type: 0, discharge_date: 0, discharge_type: 0, immunocomp: 0, other_infections: 0, comorbitity: 0, known_organism: 0, infection_class: 0, detection_method: 0, library_prep: 0, sequencer: 0, rna_dna_input: 1, library_prep_batch: 0, extraction_batch: 0 }.freeze

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

  # Add a new Metadatum entry to the sample
  def self.add_to_sample(sample, key, raw_value)
    key = key.to_sym

    # validate raises RuntimeError if invalid. Caller can handle and provide
    # feedback.
    validated_value = validate(key, raw_value)

    # Create the entry
    m = Metadatum.new
    m.key = key
    m.data_type = KEY_TO_TYPE[key]
    if KEY_TO_TYPE[key].zero?
      m.text_raw_value = raw_value
      m.text_validated_value = validated_value
    elsif KEY_TO_TYPE[key] == 1
      m.number_raw_value = raw_value
      m.number_validated_value = validated_value
    end
    m.sample = sample
    m.save
  end

  def self.validate(key, raw_value)
    # Check if the key is valid
    unless KEY_TO_TYPE.key?(key)
      msg = "Key #{key} is not a supported metadatum."
      raise msg
    end

    # Validate the value for the key
    validated_value = if KEY_TO_TYPE[key] == 1
                        validate_number(key, raw_value)
                      else
                        validate_string(key, raw_value)
                      end

    validated_value
  end

  def self.validate_number(key, raw_value)
    if raw_value.is_a?(Numeric)
      validated_value = raw_value
    else
      begin
        validated_value = Float(raw_value)
      rescue
        raise "#{raw_value} for #{key} is not a valid number."
      end
    end
    validated_value
  end

  def self.validate_string(key, raw_value)
    raw_value = raw_value.to_s
    validated_value = nil

    if KEY_TO_STRING_OPTIONS.key?(key)
      # If there are explicit string options, match the value to one of them.
      options = KEY_TO_STRING_OPTIONS[key]
      options.each do |opt|
        if str_to_basic_chars(raw_value) == str_to_basic_chars(opt)
          # Ex: Match 'neb ultra-iifs dna' to 'NEB Ultra II FS DNA'
          # Ex: Match '30-day mortality' to "30 Day Mortality"
          validated_value = opt
          break
        end
      end
      unless validated_value
        msg = "#{raw_value} for #{key} did not match options #{options.join(', ')}."
        raise msg
      end
    else
      # Otherwise any string without restricted options is OK.
      validated_value = raw_value
    end

    validated_value
  end

  def self.str_to_basic_chars(res)
    res.downcase.gsub(/[^0-9A-Za-z]/, '')
  end
end
