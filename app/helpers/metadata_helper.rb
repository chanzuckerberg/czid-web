require 'csv'

module MetadataHelper
  def official_metadata_fields_helper
    required = MetadataField.where(is_required: true)
    default = MetadataField.where(is_default: true)
    core = MetadataField.where(is_core: true)

    (required | default | core).map(&:field_info)
  end

  # TODO(mark): Generate more realistic default values.
  def generate_metadata_default_value(host_genome, field)
    unless host_genome.metadata_fields.include?(field)
      return nil
    end

    if field.base_type == Metadatum::STRING_TYPE
      if field.options.present?
        options = JSON.parse(field.options)
        return options[Random.new.rand(options.length)]
      end

      return "Example " + field.display_name
    end

    if field.base_type == Metadatum::NUMBER_TYPE
      return Random.new.rand(100)
    end

    if field.base_type == Metadatum::DATE_TYPE
      return String(Time.zone.today)
    end
  end

  def metadata_template_csv_helper
    required = MetadataField.where(is_required: true)
    default = MetadataField.where(is_default: true)

    fields = (required | default)

    field_names = ["sample_name"] + fields.pluck(:display_name)

    host_genomes = HostGenome.all.reject { |x| x.metadata_fields.empty? }

    CSV.generate(headers: true) do |csv|
      csv << field_names
      host_genomes.each do |host_genome|
        default_values = fields.map do |field|
          generate_metadata_default_value(host_genome, field)
        end

        row_name = "Example " + host_genome.name + " Sample"
        csv << [row_name] + default_values
      end
    end
  end

  # Receives an array of samples, and validates metadata from a csv.
  def validate_metadata_csv_for_samples(samples, metadata, enforce_required = false)
    errors = []
    warnings = []

    # Require sample_name as a column.
    unless metadata["headers"].include?("sample_name")
      errors.push(MetadataValidationErrors.missing_sample_name_column)
      return { "errors" => errors, "warnings" => warnings }
    end

    # Verify that the column names are supported.
    metadata["headers"].each_with_index do |header, index|
      # Check for matching MetadataField or the sample_name/host_genome_name
      unless header == "sample_name" || MetadataField.find_by(name: header) || MetadataField.find_by(display_name: header)
        errors.push(MetadataValidationErrors.column_not_supported(header, index + 1))
      end
    end

    sample_name_index = metadata["headers"].find_index("sample_name")

    metadata["rows"].each_with_index do |row, index|
      # Deleting in Excel may leaves a row of ""s in the CSV, so ignore
      next if row.all? { |c| c == "" }

      # Check number of values in the row.
      if row.length != metadata["headers"].length
        errors.push(
          MetadataValidationErrors.row_wrong_values(row.length, metadata['headers'].length, index + 1)
        )
      end

      # Check for valid sample name and fetch sample
      if row[sample_name_index].nil? || row[sample_name_index] == ""
        errors.push(MetadataValidationErrors.row_missing_sample_name(index + 1))
        next
      end

      sample = samples.find { |s| s.name == row[sample_name_index] }
      if sample.nil?
        errors.push(MetadataValidationErrors.row_invalid_sample_name(row[sample_name_index], index + 1))
        next
      end

      validated_fields = []

      # Validate the metadatum values with the sample.
      row.each_with_index do |value, col_index|
        next if col_index >= metadata["headers"].length

        # Ignore empty string values.
        next if value.nil? || value == ""

        field = metadata["headers"][col_index]

        # Ignore invalid columns.
        unless field == "sample_name" || MetadataField.find_by(name: field) || MetadataField.find_by(display_name: field)
          issues = sample.metadatum_validate(field, value)

          issues[:errors].each do |error|
            errors.push("#{error} (row #{index + 1})")
          end

          issues[:warnings].each do |warning|
            warnings.push("#{warning} (row #{index + 1})")
          end

          if issues[:errors].empty?
            validated_fields << field
          end
        end
      end

      missing_required_metadata_fields = sample.required_metadata_fields - validated_fields
      if enforce_required && !missing_required_metadata_fields.empty?
        errors.push(MetadataValidationErrors.missing_required_metadata(missing_required_metadata_fields, index + 1))
      end
    end

    {
      errors: errors,
      warnings: warnings
    }
  end
end
