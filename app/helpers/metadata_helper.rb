require 'csv'

module MetadataHelper
  def get_available_matching_field(sample, name)
    available_fields = (sample.project.metadata_fields & sample.host_genome.metadata_fields)
    return available_fields.find { |field| field.name == name || field.display_name == name }
  end

  def get_matching_core_field(sample, name)
    return sample.host_genome.metadata_fields.where(is_core: true).to_a.find { |field| field.name == name || field.display_name == name }
  end

  def get_new_custom_field(name)
    mf = MetadataField.new
    mf.name = name
    mf.display_name = name
    mf.base_type = Metadatum::STRING_TYPE
    return mf
  end

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
  def validate_metadata_csv_for_samples(samples, metadata, new_samples = false)
    # If new samples, enforce required metadata constraint, and pull the host genome from the metadata rows for validation.
    enforce_required = new_samples
    extract_host_genome_from_metadata = new_samples

    errors = []
    warnings = []

    # Require sample_name as a column.
    unless metadata["headers"].include?("sample_name")
      errors.push(MetadataValidationErrors.missing_sample_name_column)
      return { "errors" => errors, "warnings" => warnings }
    end

    # Require host_genome as a column.
    unless !extract_host_genome_from_metadata || metadata["headers"].include?("host_genome")
      errors.push(MetadataValidationErrors.missing_host_genome_column)
      return { "errors" => errors, "warnings" => warnings }
    end

    processed_samples = []

    sample_name_index = metadata["headers"].find_index("sample_name")
    host_genome_index = metadata["headers"].find_index("host_genome")

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

      if processed_samples.include?(sample)
        errors.push(MetadataValidationErrors.duplicate_sample(sample.name))
        next
      end

      processed_samples << sample

      if new_samples && !sample.project
        errors.push(MetadataValidationErrors.sample_invalid_project(sample.name, index + 1))
        next
      end

      # Check for valid host genome
      if extract_host_genome_from_metadata && (row[host_genome_index].nil? || row[host_genome_index] == "")
        errors.push(MetadataValidationErrors.row_missing_host_genome(index + 1))
        next
      end

      if extract_host_genome_from_metadata
        host_genome = HostGenome.where(name: row[host_genome_index]).first
        if host_genome.nil?
          errors.push(MetadataValidationErrors.row_invalid_host_genome(row[host_genome_index], index + 1))
          next
        end

        sample.host_genome = host_genome
      end

      # The MetadataField objects that were used to validate the metadata.
      # Needed to verify that required metadata was submitted.
      validated_fields = []

      # Validate the metadatum values with the sample.
      row.each_with_index do |value, col_index|
        next if col_index >= metadata["headers"].length

        # Ignore empty string values.
        next if value.nil? || value == ""

        field = metadata["headers"][col_index]

        # Ignore invalid columns.
        if field != "sample_name" && field != "host_genome"
          val_errors, val_warnings, val_field = sample.metadatum_validate(field, value).values_at(
            :errors, :warnings, :metadata_field
          )

          val_errors.each do |error|
            errors.push("#{error} (row #{index + 1})")
          end

          val_warnings.each do |warning|
            warnings.push("#{warning} (row #{index + 1})")
          end

          if val_errors.empty? && val_field
            validated_fields << val_field
          end
        end
      end

      missing_required_metadata_fields = sample.required_metadata_fields - validated_fields.pluck(:name)
      if enforce_required && !missing_required_metadata_fields.empty?
        errors.push(MetadataValidationErrors.row_missing_required_metadata(sample.name, missing_required_metadata_fields, index + 1))
      end
    end

    if enforce_required
      missing_samples = samples - processed_samples

      missing_samples.each do |sample|
        errors.push(MetadataValidationErrors.missing_sample_metadata_row(sample.name))
      end
    end

    {
      errors: errors,
      warnings: warnings
    }
  end
end
