# Errors and warnings for metadata.
module MetadataValidationErrors
  def self.missing_sample_name_column
    "sample_name column is required"
  end

  def self.missing_host_genome_name_column
    "host_genome_name column is required"
  end

  def self.column_not_supported(column_name, column_index)
    "#{column_name} is not a supported metadata type. (column #{column_index})"
  end

  def self.row_wrong_values(num_values, correct_num_values, row_index)
    "Row has #{num_values} instead of #{correct_num_values} (row #{row_index})"
  end

  def self.row_missing_host_genome_name(row_index)
    "Missing host_genome_name (row #{row_index})"
  end

  def self.row_invalid_host_genome_name(invalid_name, row_index)
    "#{invalid_name} is an invalid host_genome_name (row #{row_index})"
  end

  def self.row_missing_sample_name(row_index)
    "Missing sample_name (row #{row_index})"
  end

  def self.row_invalid_sample_name(invalid_name, row_index)
    "#{invalid_name} does not match any samples in this project (row #{row_index})"
  end

  def self.invalid_key_for_host_genome(key, host_genome)
    "#{key} is not a supported metadata type for host genome #{host_genome}"
  end

  def self.invalid_number(value)
    "#{value} is not a valid number"
  end

  def self.invalid_date(value)
    "#{value} is not a valid date"
  end

  def self.invalid_option(key, value)
    "#{value} is not a valid option for #{key}"
  end
end

module MetadataValidationWarnings
  def self.value_already_exists(new_value, old_value, key)
    "Value already exists. #{new_value} will overwrite #{old_value} for #{key}"
  end
end

module MetadataUploadErrors
  def self.row_missing_sample_name(row_index)
    "Missing sample_name (row #{row_index})"
  end

  def self.row_invalid_sample_name(invalid_name, row_index)
    "#{invalid_name} does not match any samples in this project (row #{row_index})"
  end

  def self.save_error(key, value, row_index)
    "Could not save #{key}, #{value} (row #{row_index})"
  end
end
