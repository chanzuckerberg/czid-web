module ErrorHelper
  module MetadataValidationErrors
    MISSING_SAMPLE_NAME_COLUMN = "\"Sample Name\" column is required.".freeze
    MISSING_HOST_GENOME_COLUMN = "\"Host Genome\" column is required.".freeze
    SAMPLE_NOT_FOUND = "Sample not found".freeze
    INVALID_FIELD_FOR_HOST_GENOME = "Invalid metadata field key for host genome.".freeze
    INVALID_OPTION = "Invalid option for metadata field.".freeze
    INVALID_DATE = "Invalid date for metadata field.".freeze
    INVALID_NUMBER = "Invalid number for metadata field.".freeze
    NUMBER_OUT_OF_RANGE = "Number is out of range.".freeze
  end

  module MetadataUploadErrors
    def self.invalid_sample_name(invalid_name)
      "'#{invalid_name}' does not match any samples in this project"
    end

    def self.save_error(key, value)
      "Could not save '#{key}', '#{value}'"
    end
  end

  module SampleUploadErrors
    def self.invalid_project_id(sample)
      "Could not save sample '#{sample['name']}'. Invalid project id."
    end

    def self.missing_required_metadata(sample, missing_metadata_fields)
      "Could not save sample '#{sample['name']}'. Missing required metadata: #{missing_metadata_fields.join(', ')}"
    end
  end

  DATE_INVALID_ERROR_HUMAN = "Please input a date in the format YYYY-MM or MM/YYYY. (for human samples)".freeze
  DATE_INVALID_ERROR = "Please input a date in the format YYYY-MM-DD, YYYY-MM, MM/DD/YY, or MM/YYYY.".freeze
  NUMBER_INVALID_ERROR = "Please input a number.".freeze

  def get_field_error(field, is_human = false)
    if field.base_type == 2
      if is_human
        return DATE_INVALID_ERROR_HUMAN
      else
        return DATE_INVALID_ERROR
      end
    end

    if field.base_type == 1
      return NUMBER_INVALID_ERROR
    end

    if field.base_type.zero?
      if field.force_options
        return "The valid options are #{JSON.parse(field.options).join(', ')}."
      else
        return "There was an error. Please contact us for help."
      end
    end
  end

  # Aggregates errors (and warnings) into groups
  class ErrorAggregator
    ERRORS = {
      no_matching_sample_existing: {
        headers: ["Row #", "Sample Name"],
        title: ->(num_rows, _) { "#{num_rows} sample names do not match any samples in this project." }
      },
      no_matching_sample_new: {
        headers: ["Row #", "Sample Name"],
        title: ->(num_rows, _) { "#{num_rows} sample names do not match any samples being uploaded." }
      },
      row_wrong_num_values: {
        headers: ["Row #", "Sample Name", "Number of Values"],
        title: ->(num_rows, metadata) { "#{num_rows} rows have an unexpected number of values. (#{metadata['num_cols']} values expected based on the number of CSV headers.)" }
      },
      row_missing_sample_name: {
        headers: ["Row #"],
        title: ->(num_rows, _) { "#{num_rows} rows are missing sample names." }
      },
      row_duplicate_sample: {
        headers: ["Row #", "Sample Name"],
        title: ->(num_rows, _) { "#{num_rows} rows are duplicates of earlier rows." }
      },
      row_missing_required_metadata: {
        headers: ["Row #", "Sample Name", "Missing Fields"],
        title: ->(num_rows, _) { "#{num_rows} samples are missing required metadata fields." }
      },
      missing_sample: {
        headers: ["Sample Name"],
        title: ->(num_rows, _) { "#{num_rows} samples are missing from the CSV. Please upload required metadata." }
      },
      # This should theoretically never happen if the user uses the upload UI.
      row_invalid_project_id: {
        headers: ["Row #", "Sample Name"],
        title: ->(num_rows, _) { "#{num_rows} samples are assigned to an invalid project. Please contact us for support." }
      },
      row_missing_host_genome: {
        headers: ["Row #", "Sample Name"],
        title: ->(num_rows, _) { "#{num_rows} rows are missing host genomes." }
      },
      row_invalid_host_genome: {
        headers: ["Row #", "Sample Name", "Invalid Host Genome"],
        title: ->(num_rows, _) { "#{num_rows} rows specify host genomes that are not supported." }
      },
      # This should theoretically never happen. This is when a Metadata object doesn't have a sample attached to it.
      sample_not_found: {
        headers: ["Row #", "Sample Name"],
        title: ->(num_rows, _) { "#{num_rows} samples were unexpectedly missing. Please contact us for support." }
      },
      # This should theoretically never happen since we now have custom fields.
      invalid_key_for_host_genome: {
        headers: ["Row #", "Sample Name", "Host Genome Name", "Invalid Field"],
        title: ->(num_rows, _) { "#{num_rows} rows specify values for fields that are incompatible with the sample's host genome." }
      },
      value_already_exists: {
        headers: ["Row #", "Sample Name", "Field", "Old Value", "New Value"],
        title: ->(num_rows, _) { "#{num_rows} metadata fields will be permanently overwritten." }
      },
      custom_field_creation: {
        headers: ["Column #", "Field"],
        title: ->(num_cols, _) { "#{num_cols} new custom fields will be created. Please check our metadata dictionary to see if your fields are listed under different names." }
      }
    }.freeze

    def initialize
      # Map of aggregated errors.
      @error_map = {}
      # Additional metadata used to generate error titles. For example, number of columns in the uploaded CSV.
      @metadata = {}
      # Map of supported errors. Use dup so that the copy isn't frozen.
      @supported_errors = ERRORS.dup
    end

    def add_error(error_type, error_params)
      unless @supported_errors[error_type]
        raise ArgumentError, "error type not supported #{error_type}"
      end

      if error_params.length != @supported_errors[error_type][:headers].length
        raise ArgumentError, "wrong number of error params (#{error_params.length} instead of #{@supported_errors[error_type][:headers].length})"
      end

      errors = @error_map[error_type] || []
      errors.push(error_params)
      @error_map[error_type] = errors
    end

    def set_metadata(key, value)
      @metadata[key] = value
    end

    # This is a special-case function that adds an error group to this aggregator,
    # which groups "invalid raw value" validation errors for a particular metadata field.
    # For example: for collection_date, a "Please input a valid date" message.
    def create_raw_value_error_group_for_metadata_field(field, col_index, is_human = false)
      error_type = "#{field.name}_invalid_raw_value"

      if field.base_type == 2 && is_human
        error_type = "#{field.name}_invalid_raw_value_human"
      end

      # Add an error type if it doesn't already exist.
      unless @supported_errors[error_type]
        # Automatically determine the kind of error to display based on the field.
        if field.base_type == 2
          @supported_errors[error_type] = if is_human
                                            {
                                              headers: ["Row #", "Sample Name", "Invalid Value"],
                                              title: ->(num_rows, _) { "#{num_rows} invalid values for \"#{field.display_name}\" (column #{col_index}). #{DATE_INVALID_ERROR_HUMAN}" }
                                            }
                                          else
                                            {
                                              headers: ["Row #", "Sample Name", "Invalid Value"],
                                              title: ->(num_rows, _) { "#{num_rows} invalid values for \"#{field.display_name}\" (column #{col_index}). #{DATE_INVALID_ERROR}" }
                                            }
                                          end
        end

        if field.base_type == 1
          @supported_errors[error_type] = {
            headers: ["Row #", "Sample Name", "Invalid Value"],
            title: ->(num_rows, _) { "#{num_rows} invalid values for \"#{field.display_name}\" (column #{col_index}). #{NUMBER_INVALID_ERROR}" }
          }
        end

        if field.base_type.zero?
          @supported_errors[error_type] = if field.force_options
                                            {
                                              headers: ["Row #", "Sample Name", "Invalid Value"],
                                              title: ->(num_rows, _) { "#{num_rows} invalid values for \"#{field.display_name}\" (column #{col_index}). The valid options are #{JSON.parse(field.options).join(', ')}." }
                                            }
                                          else
                                            # This should theoreticaly never happen, because string fields with force_options=false have no validation constraints.
                                            {
                                              headers: ["Row #", "Sample Name", "Invalid Value"],
                                              title: ->(num_rows, _) { "#{num_rows} invalid values for \"#{field.display_name}\" (column #{col_index}). Please contact us for help." }
                                            }
                                          end
        end
      end

      return error_type
    end

    # Get the error groups that have been aggregated so far.
    def error_groups
      error_groups = []

      @error_map.each do |type, params|
        error_groups.push(caption: @supported_errors[type][:title].call(params.length, @metadata),
                          headers: @supported_errors[type][:headers],
                          rows: params,
                          isGroup: true)
      end

      return error_groups
    end
  end
end
