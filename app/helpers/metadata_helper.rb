require 'csv'

module MetadataHelper
  include ErrorHelper

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
  def generate_metadata_default_value(field, host_genome_name)
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
      return Time.zone.today.strftime(host_genome_name == "Human" ? "%Y-%m" : "%Y-%m-%d")
    end
  end

  def metadata_template_csv_helper(project_id, new_sample_names)
    samples_are_new = !new_sample_names.nil?
    project = Project.where(id: project_id)[0]

    # If project is nil, use global default and required fields.
    fields = if project.nil?
               required = MetadataField.where(is_required: true)
               default = MetadataField.where(is_default: true)

               (required | default)
             # If samples are new, just use Human metadata fields since we default to Human.
             elsif samples_are_new
               HostGenome.find_by(name: "Human").metadata_fields & project.metadata_fields
             else
               project.metadata_fields
             end

    field_names = ["Sample Name"] + (samples_are_new ? ["Host Genome"] : []) + fields.pluck(:display_name)

    host_genomes_by_name = HostGenome.all.includes(:metadata_fields).reject { |x| x.metadata_fields.empty? }.index_by(&:name)

    # Assemble sample objects based on params.
    samples = if samples_are_new
                # Use new sample names if provided.
                new_sample_names.map do |sample_name|
                  {
                    name: sample_name,
                    # For now, always default to Human for new samples.
                    host_genome_name: "Human"
                  }
                end
              elsif project.nil?
                # If the project is nil, construct a sample for each host genome.
                host_genomes_by_name.map do |name, _|
                  {
                    name: "Example #{name} Sample",
                    host_genome_name: name
                  }
                end
              else
                # Use existing samples in the project.
                Sample.includes(:host_genome).where(id: project.sample_ids).map do |sample|
                  {
                    name: sample.name,
                    host_genome_name: sample.host_genome_name
                  }
                end
              end

    CSV.generate(headers: true) do |csv|
      csv << field_names
      samples.each do |sample|
        values = fields.map do |field|
          if host_genomes_by_name[sample[:host_genome_name]].metadata_fields.include?(field)
            generate_metadata_default_value(field, sample[:host_genome_name])
          end
        end

        csv << [sample[:name]] + (samples_are_new ? [sample[:host_genome_name]] : []) + values
      end
    end
  end

  # Receives an array of samples, and validates metadata from a csv.
  def validate_metadata_csv_for_samples(samples, metadata, new_samples = false)
    # If new samples, enforce required metadata constraint, and pull the host genome from the metadata rows for validation.
    enforce_required = new_samples
    extract_host_genome_from_metadata = new_samples

    errors = []
    error_aggregator = ErrorAggregator.new
    error_aggregator.set_metadata("num_cols", metadata["headers"].length)
    warning_aggregator = ErrorAggregator.new

    # Require sample_name or Sample Name column.
    if (metadata["headers"] & ["sample_name", "Sample Name"]).blank?
      errors.push(MetadataValidationErrors::MISSING_SAMPLE_NAME_COLUMN)
      return { "errors" => errors, "warnings" => [] }
    end

    # Require host_genome or Host Genome column.
    unless !extract_host_genome_from_metadata || (metadata["headers"] & ["host_genome", "Host Genome"]).present?
      errors.push(MetadataValidationErrors::MISSING_HOST_GENOME_COLUMN)
      return { "errors" => errors, "warnings" => [] }
    end

    processed_samples = []

    sample_name_index = metadata["headers"].find_index("sample_name") || metadata["headers"].find_index("Sample Name")
    host_genome_index = metadata["headers"].find_index("host_genome") || metadata["headers"].find_index("Host Genome")

    # Make a best effort to guess which custom fields will be created.
    # This validation actually misses one non-critical edge case:
    # If a user uploads "Blood Fed" for a Human Sample (our default Blood Fed field is only for Mosquito),
    # our system will create a custom field for Blood Fed for that project (assigned to Human).
    # That custom field won't be listed here, since we don't restrict the fields to host genomes here.
    # TODO(mark): Detect this edge case and output a warning.
    if samples[0].project
      matching_fields =
        (samples[0].project.metadata_fields | MetadataField.where(is_core: 1))
        .select { |field| metadata["headers"].include?(field.name) || metadata["headers"].include?(field.display_name) }

      metadata["headers"].each_with_index do |col, index|
        next if ["sample_name", "Sample Name", "host_genome", "Host Genome"].include?(col)

        matching_field = matching_fields.select { |field| field.name == col || field.display_name == col }

        if matching_field.empty?
          warning_aggregator.add_error(:custom_field_creation, [index + 1, col])
        end
      end
    end

    metadata["rows"].each_with_index do |row, index|
      # Deleting in Excel may leaves a row of ""s in the CSV, so ignore
      next if row.all? { |c| c == "" }

      # Check number of values in the row.
      if row.length != metadata["headers"].length
        error_aggregator.add_error(:row_wrong_num_values, [index + 1, row[sample_name_index], row.length])
      end

      # Check for valid sample name and fetch sample
      if row[sample_name_index].nil? || row[sample_name_index] == ""
        error_aggregator.add_error(:row_missing_sample_name, [index + 1])
        next
      end
      sample = samples.find { |s| s.name == row[sample_name_index] }

      if sample.nil?
        if new_samples
          error_aggregator.add_error(:no_matching_sample_new, [index + 1, row[sample_name_index]])
        else
          error_aggregator.add_error(:no_matching_sample_existing, [index + 1, row[sample_name_index]])
        end
        next
      end

      if processed_samples.include?(sample)
        error_aggregator.add_error(:row_duplicate_sample, [index + 1, sample.name])
        next
      end

      processed_samples << sample

      if new_samples && !sample.project
        error_aggregator.add_error(:row_invalid_project_id, [index + 1, sample.name])
        next
      end

      # Check for valid host genome
      if extract_host_genome_from_metadata && (row[host_genome_index].nil? || row[host_genome_index] == "")
        error_aggregator.add_error(:row_missing_host_genome, [index + 1, sample.name])
        next
      end

      if extract_host_genome_from_metadata
        host_genome = HostGenome.where(name: row[host_genome_index]).first
        if host_genome.nil?
          error_aggregator.add_error(:row_invalid_host_genome, [index + 1, sample.name, row[host_genome_index]])
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
        next if ["sample_name", "Sample Name", "host_genome", "Host Genome"].include?(field)
        val_errors, val_field = sample.metadatum_validate(field, value).values_at(
          :errors, :metadata_field
        )

        # Add errors based on the type of validation error.
        if val_errors[:sample_not_found] && !val_errors[:missing_sample].empty?
          error_aggregator.add_error(:sample_not_found, [index + 1, sample.name])
        end

        if val_errors[:invalid_key_for_host_genome].present?
          error_aggregator.add_error(:invalid_key_for_host_genome, [index + 1, sample.name, sample.host_genome_name, field])
        end

        if val_errors[:raw_value].present?
          # Create a custom error group if it hasn't already been done.
          error_key = error_aggregator.create_raw_value_error_group_for_metadata_field(val_field, col_index + 1)
          error_aggregator.add_error(error_key, [index + 1, sample.name, value])
        end

        if !value.empty? && val_field
          validated_fields << val_field
        end

        existing_m = sample.get_existing_metadatum(field.to_s)

        # We currently compare the raw_value because val is also a raw string, so we compare equivalent things.
        if existing_m && !existing_m.raw_value.nil? && existing_m.raw_value != value
          warning_aggregator.add_error(:value_already_exists, [index + 1, sample.name, field, existing_m.raw_value, value])
        end
      end

      missing_required_metadata_fields = sample.required_metadata_fields.pluck(:display_name) - validated_fields.pluck(:display_name)
      if enforce_required && !missing_required_metadata_fields.empty?
        error_aggregator.add_error(:row_missing_required_metadata, [index + 1, sample.name, missing_required_metadata_fields.join(", ")])
      end
    end

    if enforce_required
      missing_samples = samples - processed_samples

      missing_samples.each do |sample|
        error_aggregator.add_error(:missing_sample, [sample.name])
      end
    end

    {
      warnings: warning_aggregator.error_groups,
      errors: errors + error_aggregator.error_groups
    }
  end
end
