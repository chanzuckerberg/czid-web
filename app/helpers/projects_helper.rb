module ProjectsHelper
  # This method DOESN'T check that each row has required metadata fields such as collection_location, tissue_type.
  # This can validate both samples that are already created, as well as samples that are new.
  def validate_metadata_csv_for_project(project_samples, metadata, new_samples)
    errors = []
    warnings = []

    if new_samples
      # Require host_genome_name as a column.
      unless metadata["headers"].include?("host_genome_name")
        errors.push(MetadataValidationErrors.missing_host_genome_name_column)
        return { "errors" => errors, "warnings" => warnings }
      end
    else
      # Require sample_name as a column.
      unless metadata["headers"].include?("sample_name")
        errors.push(MetadataValidationErrors.missing_sample_name_column)
        return { "errors" => errors, "warnings" => warnings }
      end
    end

    # Verify that the column names are supported.
    metadata["headers"].each_with_index do |header, index|
      if header != "sample_name" && header != "host_genome_name" && !Metadatum::KEY_TO_TYPE.key?(header.to_sym)
        errors.push(MetadataValidationErrors.column_not_supported(header, index + 1))
      end
    end

    sample_name_index = metadata["headers"].find_index("sample_name")
    host_genome_name_index = metadata["headers"].find_index("host_genome_name")

    metadata["rows"].each_with_index do |row, index|
      # Check number of values in the row.
      if row.length != metadata["headers"].length
        errors.push(
          MetadataValidationErrors.row_wrong_values(row.length, metadata['headers'].length, index + 1)
        )
      end

      if new_samples
        # Check for valid host_genome_name and create temporary sample
        if row[host_genome_name_index].nil? || row[host_genome_name_index] == ""
          errors.push(MetadataValidationErrors.row_missing_host_genome_name(index + 1))
          next
        end
        host_genome = HostGenome.where(name: row[host_genome_name_index]).first
        if host_genome.nil?
          errors.push(MetadataValidationErrors.row_invalid_host_genome_name(row[host_genome_name_index], index + 1))
          next
        end

        # Create temporary sample to run metadatum validation
        sample = Sample.new
        sample.host_genome_id = host_genome.id
      else
        # Check for valid sample name and fetch sample
        if row[sample_name_index].nil? || row[sample_name_index] == ""
          errors.push(MetadataValidationErrors.row_missing_sample_name(index + 1))
          next
        end
        sample = project_samples.where(name: row[sample_name_index]).first
        if sample.nil?
          errors.push(MetadataValidationErrors.row_invalid_sample_name(row[sample_name_index], index + 1))
          next
        end
      end

      # Validate the metadatum values with the sample.
      row.each_with_index do |value, row_index|
        next if row_index >= metadata["headers"].length

        # Ignore empty string values.
        next if value.nil? || value == ""

        metadata_type = metadata["headers"][row_index]

        # Ignore invalid columns.
        if metadata_type != "sample_name" && metadata_type != "host_genome_name" && Metadatum::KEY_TO_TYPE.key?(metadata_type.to_sym)
          issues = sample.metadatum_validate(metadata_type, value)

          issues[:errors].each do |error|
            errors.push("#{error} (row #{index + 1})")
          end

          issues[:warnings].each do |warning|
            warnings.push("#{warning} (row #{index + 1})")
          end
        end
      end
    end

    {
      errors: errors,
      warnings: warnings
    }
  end

  def upload_metadata_for_project(project_samples, metadata)
    errors = []

    metadata.each_with_index do |metadata_object, index|
      sample_name = metadata_object["sample_name"]

      unless sample_name
        errors.push(MetadataUploadErrors.row_missing_sample_name(index + 1))
        next
      end

      sample = project_samples.where(name: sample_name).first

      unless sample
        errors.push(MetadataUploadErrors.row_invalid_sample_name(sample_name, index + 1))
        next
      end

      metadata_object.each do |key, value|
        next if key == "sample_name"

        saved = sample.metadatum_add_or_update(key, value)

        unless saved
          errors.push(MetadataUploadErrors.save_error(key, value, index + 1))
        end
      end
    end
    errors
  end
end
