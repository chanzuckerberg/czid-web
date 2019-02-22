# Errors and warnings for metadata.
module MetadataValidationErrors
  def self.missing_sample
    "Sample not found, may have been deleted"
  end

  def self.missing_sample_name_column
    "sample_name column is required"
  end

  def self.missing_host_genome_column
    "host_genome column is required"
  end

  def self.column_not_supported(column_name, column_index)
    "#{column_name} is not a supported metadata type. (column #{column_index})"
  end

  def self.row_wrong_values(num_values, correct_num_values, row_index)
    "Row has #{num_values} instead of #{correct_num_values} (row #{row_index})"
  end

  def self.row_missing_sample_name(row_index)
    "Missing sample_name (row #{row_index})"
  end

  def self.row_missing_host_genome(row_index)
    "Missing host_genome (row #{row_index})"
  end

  def self.row_invalid_sample_name(invalid_name, row_index)
    "#{invalid_name} does not match any samples in this project (row #{row_index})"
  end

  def self.row_invalid_host_genome(invalid_name, row_index)
    "#{invalid_name} is not a valid host genome (row #{row_index})"
  end

  def self.sample_invalid_project(sample_name, row_index)
    "Sample #{sample_name} is assigned to an invalid project (row #{row_index})"
  end

  def self.row_missing_required_metadata(sample_name, missing_metadata_fields, row_index)
    "Sample #{sample_name} is missing required metadata: #{missing_metadata_fields.join(', ')}. (row #{row_index})"
  end

  def self.missing_sample_metadata_row(sample_name)
    "Sample #{sample_name} is missing from the metadata CSV. Please upload required metadata."
  end

  def self.duplicate_sample(sample_name)
    "Sample #{sample_name} appears multiple times in the metadata CSV."
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
  def self.invalid_sample_name(invalid_name)
    "#{invalid_name} does not match any samples in this project"
  end

  def self.save_error(key, value)
    "Could not save #{key}, #{value}"
  end
end

module SampleUploadErrors
  def self.invalid_project_id(sample)
    "Could not save sample #{sample['name']}. Invalid project id."
  end

  def self.missing_required_metadata(sample, missing_metadata_fields)
    "Could not save sample #{sample['name']}. Missing required metadata: #{missing_metadata_fields.join(', ')}"
  end
end
