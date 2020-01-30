require 'csv'

module MetadataHelper
  include ErrorHelper

  def get_available_matching_field(sample, name)
    available_fields = sample.project.metadata_fields
    return available_fields.find { |field| field.name == name || field.display_name == name }
  end

  def get_matching_core_field(sample, name)
    return sample.host_genome.metadata_fields.where(is_core: true).to_a.find { |field| field.name == name || field.display_name == name }
  end

  def get_new_custom_field(name)
    mf = MetadataField.new
    mf.name = name
    mf.display_name = name
    mf.base_type = MetadataField::STRING_TYPE
    return mf
  end

  def official_metadata_fields_helper
    required = MetadataField.where(is_required: true).includes(:host_genomes)
    default = MetadataField.where(is_default: true).includes(:host_genomes)
    core = MetadataField.where(is_core: true).includes(:host_genomes)

    (required | default | core).map(&:field_info)
  end

  # TODO(mark): Generate more realistic default values.
  def generate_metadata_default_value(field, host_genome_name)
    if field.base_type == MetadataField::STRING_TYPE
      if field.options.present?
        options = JSON.parse(field.options)
        return options[Random.new.rand(options.length)]
      end

      return "Example " + field.display_name
    end

    if field.base_type == MetadataField::NUMBER_TYPE
      return Random.new.rand(100)
    end

    if field.base_type == MetadataField::DATE_TYPE
      return Time.zone.today.strftime(host_genome_name == "Human" ? "%Y-%m" : "%Y-%m-%d")
    end
  end

  def metadata_template_csv_helper(project_id, new_sample_names)
    samples_are_new = !new_sample_names.nil?
    project = Project.where(id: project_id)[0]
    # We should include the host genome columns if the user is downloading the template during new sample upload, or
    # downloading it from a stand-alone upload instruction page such as /cli_user_instructions.
    # The CLI also directs users to /metadata/metadata_template_csv when asking for metadata during new sample upload,
    # and we should include the host genome column here as well.
    include_host_genome = project.nil? || samples_are_new

    # If project is nil, use global default and required fields.
    fields = if project.nil?
               required = MetadataField.where(is_required: true)
               default = MetadataField.where(is_default: true)

               (required | default)
             # If samples are new, just use Human metadata fields since Human is by far most common.
             elsif samples_are_new
               HostGenome.find_by(name: "Human").metadata_fields & project.metadata_fields
             else
               # Only use fields from the project that correspond to the host genomes of existing samples.
               host_genome_ids = Sample.where(id: project.sample_ids).pluck(:host_genome_id).uniq
               project.metadata_fields.includes(:host_genomes).reject { |field| (field.host_genome_ids & host_genome_ids).empty? }
             end

    # Show fields with is_required=1 first in the CSV, but otherwise keep the default order.
    fields = fields.sort_by { |f| [-f.is_required, f.id] }

    # Hide legacy collection_location (v1) field from CSV templates.
    # TODO(jsheu): Remove legacy field and swap in collection_location_v2.
    fields = fields.reject { |f| f.name == "collection_location" }

    field_names = ["Sample Name"] + (include_host_genome ? ["Host Genome"] : []) + fields.pluck(:display_name)

    host_genomes_by_name = HostGenome.all.includes(:metadata_fields).reject { |x| x.metadata_fields.empty? }.index_by(&:name)

    # Assemble sample objects based on params.
    samples = if samples_are_new
                # Use new sample names if provided.
                new_sample_names.map do |sample_name|
                  {
                    name: sample_name,
                    # For now, always default to Human for new samples.
                    host_genome_name: "Human",
                  }
                end
              elsif project.nil?
                # If the project is nil, construct a sample for each host genome.
                host_genomes_by_name.map do |name, _|
                  {
                    name: "Example #{name} Sample",
                    host_genome_name: name,
                  }
                end
              else
                # Use existing samples in the project.
                Sample.includes(:host_genome, :metadata).where(id: project.sample_ids).map do |sample|
                  {
                    name: sample.name,
                    host_genome_name: sample.host_genome_name,
                    metadata: sample.metadata.index_by(&:key),
                  }
                end
              end

    CSVSafe.generate(headers: true) do |csv|
      csv << field_names
      samples.each do |sample|
        values = fields.map do |field|
          if host_genomes_by_name[sample[:host_genome_name]].metadata_fields.include?(field)
            if samples_are_new
              nil
            elsif project.nil?
              generate_metadata_default_value(field, sample[:host_genome_name])
            else
              sample[:metadata][field.name]&.csv_template_value
            end
          end
        end

        csv << [sample[:name]] + (include_host_genome ? [sample[:host_genome_name]] : []) + values
      end
    end
  end

  # Determines whether a set of columns has duplicates.
  # We account for both the name and display name of existing metadata fields when determining duplicates.
  # We add an error to the error_aggregator for each duplicate we find.
  def metadata_csv_has_duplicate_columns(columns, existing_fields, error_aggregator)
    column_to_index = {}
    has_duplicate_columns = false

    # Prevent duplicate columns.
    columns.each_with_index do |col, index|
      if column_to_index[col].present?
        error_aggregator.add_error(:duplicate_columns, [index, col, column_to_index[col]])
        has_duplicate_columns = true
      end

      # Account for both the name and the display_name, as both are accepted.
      if ["sample_name", "Sample Name"].include?(col)
        column_to_index["sample_name"] = index
        column_to_index["Sample Name"] = index
      elsif ["host_genome", "Host Genome"].include?(col)
        column_to_index["host_genome"] = index
        column_to_index["Host Genome"] = index
      else
        matching_field = existing_fields.select { |field| field.name == col || field.display_name == col }

        if !matching_field.empty?
          column_to_index[matching_field[0].name] = index
          column_to_index[matching_field[0].display_name] = index
        # If it's a custom field, just add the name.
        else
          column_to_index[col] = index
        end
      end
    end

    return has_duplicate_columns
  end

  # Convenience wrapper
  def validate_metadata_csv_for_project_samples(samples, metadata)
    validate_metadata_csv_for_samples(samples, metadata, false, false)
  end

  # Convenience wrapper
  def validate_metadata_csv_for_new_samples(samples, metadata)
    # TODO: (gdingle): remove admin only after launch. See https://jira.czi.team/browse/IDSEQ-2051.
    issues = validate_metadata_csv_for_samples(samples, metadata, true, current_user.admin?)
    # repackage for coherence
    [issues.reject(:new_host_genomes), issues[:new_host_genomes]]
  end

  private

  # Receives an array of samples, and validates metadata from a csv.
  # NOTE: validation depends on fields of each sample which depends on fields of each sample project.
  def validate_metadata_csv_for_samples(
    samples,
    metadata,
    new_samples = false,
    allow_new_host_genomes = false
  )
    # If new samples, enforce required metadata constraint, and pull the host genome from the
    # metadata rows for validation.
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
    if extract_host_genome_from_metadata && (metadata["headers"] & ["host_genome", "Host Genome"]).blank?
      errors.push(MetadataValidationErrors::MISSING_HOST_GENOME_COLUMN)
      return { "errors" => errors, "warnings" => [] }
    end

    existing_fields = MetadataField.where(is_core: 1)

    if samples[0].project
      existing_fields |= samples[0].project.metadata_fields
    end

    # If there are duplicate columns, abort and return with the errors.
    if metadata_csv_has_duplicate_columns(metadata["headers"], existing_fields, error_aggregator)
      return { "errors" => errors + error_aggregator.error_groups, "warnings" => [] }
    end

    # Add a warning for each custom field that will be created.
    metadata["headers"].each_with_index do |col, index|
      next if ["sample_name", "Sample Name", "host_genome", "Host Genome"].include?(col)

      matching_field = existing_fields.select { |field| field.name == col || field.display_name == col }

      if matching_field.empty?
        warning_aggregator.add_error(:custom_field_creation, [index + 1, col])
      end
    end

    sample_name_index = metadata["headers"].find_index("sample_name") || metadata["headers"].find_index("Sample Name")

    if extract_host_genome_from_metadata
      host_genomes, host_genome_index, new_host_genomes =
        find_or_create_host_genomes(metadata, allow_new_host_genomes)
    end

    processed_samples = []

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
        host_genome = host_genomes.select { |cur_hg| cur_hg && cur_hg.name.casecmp?(row[host_genome_index]) }.first

        # TODO: (gdingle): This behavior will change after removal of admin-only of new host genome input.
        # See https://jira.czi.team/browse/IDSEQ-2051.
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

        if val_errors[:invalid_field_for_host_genome].present?
          error_aggregator.add_error(:invalid_key_for_host_genome, [index + 1, sample.name, sample.host_genome_name, field])
        end

        if val_errors[:raw_value].present?
          # Create a custom error group if it hasn't already been done.
          error_key = error_aggregator.create_raw_value_error_group_for_metadata_field(val_field, col_index + 1, sample.host_genome_name == "Human")
          error_aggregator.add_error(error_key, [index + 1, sample.name, value])
        end

        if !value.empty? && val_field
          validated_fields << val_field
        end

        existing_m = sample.get_existing_metadatum(field.to_s)

        # We currently compare the raw_value because val is also a raw string, so we compare equivalent things.
        if existing_m && val_errors.empty? && !existing_m.raw_value.nil? && existing_m.raw_value != value
          warning_aggregator.add_error(:value_already_exists, [index + 1, sample.name, field, existing_m.raw_value, value])
        end
      end

      if enforce_required
        missing_required_metadata_fields = sample.required_metadata_fields.pluck(:display_name) - validated_fields.pluck(:display_name)
        unless missing_required_metadata_fields.empty?
          error_aggregator.add_error(:row_missing_required_metadata, [index + 1, sample.name, missing_required_metadata_fields.join(", ")])
        end
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
      errors: errors + error_aggregator.error_groups,
      new_host_genomes: new_host_genomes,
    }
  end

  def find_or_create_host_genomes(metadata, allow_new_host_genomes)
    new_host_genomes = []
    host_genome_index = metadata["headers"].find_index("host_genome") || metadata["headers"].find_index("Host Genome")
    # same name rules as before_validation
    host_genome_names = metadata["rows"].map { |row| row[host_genome_index] }.uniq
    host_genomes = if allow_new_host_genomes
                     host_genome_names.map do |name|
                       hg = HostGenome.find_by(name: name) # case insensitive
                       unless hg
                         hg = HostGenome.new(name: name, user: current_user)
                         new_host_genomes << hg
                       end
                       hg.save && hg
                     end
                   else
                     HostGenome.where(name: host_genome_names).includes(:metadata_fields)
                   end
    [host_genomes.to_a, host_genome_index, new_host_genomes]
  end
end
