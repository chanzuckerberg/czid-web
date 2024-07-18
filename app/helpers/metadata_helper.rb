require 'csv'

module MetadataHelper
  include ErrorHelper

  def get_available_matching_field(sample, name)
    available_fields = sample.project.metadata_fields.to_a
    return available_fields.find { |field| field.name == name || field.display_name == name }
  end

  def get_matching_core_field(sample, name)
    fields = sample.host_genome.metadata_fields.where(is_core: true).to_a
    return fields.find { |field| field.name == name || field.display_name == name }
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

  # Orders metadata fields for csv output.
  # Accepts ActiveRelation or array, but always outputs array.
  def self.order_metadata_fields_for_csv(fields)
    # Show fields with is_required=1 first in the CSV, but otherwise keep the default order.
    fields = fields.sort_by { |f| [-f.is_required, f.id] }

    # Hide legacy collection_location (v1) field from CSV templates.
    # TODO(jsheu): Remove legacy field and swap in collection_location_v2.
    return fields.reject { |f| f.name == "collection_location" }
  end

  # Outputs csv header strings for the provided metadata fields.
  def self.get_csv_headers_for_metadata_fields(fields)
    fields.map do |field|
      # Change collection_location_v2 to collection_location.
      field.name == "collection_location_v2" ? "collection_location" : field.name
    end
  end

  # Returns all unique MetadataFields that the provided samples have metadata for.
  def self.get_unique_metadata_fields_for_samples(samples)
    sample_ids = samples.pluck(:id)
    metadata_field_ids = Metadatum.where(sample_id: sample_ids).pluck(:metadata_field_id).uniq
    MetadataField.where(id: metadata_field_ids)
  end

  def metadata_template_csv_helper(project_id:, new_sample_names:, host_genomes:)
    samples_are_new = !new_sample_names.nil?
    project = Project.where(id: project_id)[0]
    # We should include the host genome columns if the user is downloading the template during new sample upload, or
    # downloading it from a stand-alone upload instruction page such as /cli_user_instructions.
    # The CLI also directs users to /metadata/metadata_template_csv when asking for metadata during new sample upload,
    # and we should include the host genome column here as well.
    # NOTE: In Feb 2020, Host Genome was renamed in the UI to Host Organism.
    # Both names are equivalent in CSV upload.
    include_host_genome = project.nil? || samples_are_new

    fields = if host_genomes.any?
               required = MetadataField.where(is_required: true)
               default = MetadataField.where(is_default: true)
               required | default | host_genomes.flat_map do |name|
                 HostGenome.find_by(name: name).metadata_fields
               end
             # If project is nil, use global default and required fields.
             elsif project.nil?
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

    fields = MetadataHelper.order_metadata_fields_for_csv(fields)

    field_names = ["Sample Name"] + (include_host_genome ? ["Host Organism"] : []) + fields.pluck(:display_name)

    host_genomes_by_name = HostGenome.all.includes(:metadata_fields).select(&:show_as_option?).reject { |x| x.metadata_fields.empty? }.index_by { |x| x.name.downcase }

    # Assemble sample objects based on params.
    samples = if samples_are_new
                unless new_sample_names.is_a?(Enumerable)
                  # Should not happen but indicates a client error.
                  raise "new_sample_names should be an array"
                end

                # Use new sample names if provided.
                new_sample_names.map.with_index do |sample_name, i|
                  # By Default, always default to Human for new samples.
                  hg = i >= host_genomes.length ? "Human" : host_genomes[i]
                  {
                    name: sample_name,
                    host_genome_name: hg,
                  }
                end
              elsif project.nil?
                # If the project is nil, construct a sample for each host genome.
                host_genomes_by_name.map do |_, hg|
                  {
                    name: "Example #{hg.name} Sample",
                    host_genome_name: hg.name,
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
        hg = host_genomes_by_name[sample[:host_genome_name].downcase]
        values = fields.map do |field|
          if hg && hg.metadata_fields.include?(field)
            if samples_are_new
              nil
            elsif project.nil?
              generate_metadata_default_value(field, hg.name)
            else
              metadata_value = sample[:metadata][field.name]&.csv_compatible_value
              host_is_human = hg.name == "Human"
              host_age_above_max = field.name == "host_age" && metadata_value.to_i >= MetadataField::MAX_HUMAN_AGE
              if host_is_human && host_age_above_max
                # Convert metadata to HIPAA-compliant values
                "≥ #{MetadataField::MAX_HUMAN_AGE}"
              else
                metadata_value
              end
            end
          end
        end

        host_genome_name = hg ? hg.name : sample[:host_genome_name]
        csv << [sample[:name]] + (include_host_genome ? [host_genome_name] : []) + values
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
      if MetadataField::SAMPLE_NAME_SYNONYMS.include?(col)
        MetadataField::SAMPLE_NAME_SYNONYMS.map { |key| column_to_index[key] = index }
      elsif MetadataField::HOST_GENOME_SYNONYMS.include?(col)
        MetadataField::HOST_GENOME_SYNONYMS.map { |key| column_to_index[key] = index }
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

  # Convenience wrapper. NOTE: this method will return initialized
  # new_host_genomes that pass validation as second part of a pair.
  def validate_metadata_csv_for_new_samples(samples, metadata)
    issues = validate_metadata_csv_for_samples(
      samples,
      metadata,
      true,
      true
    )
    # repackage for coherence
    [issues.reject { |key| key == :new_host_genomes }, issues[:new_host_genomes] || []]
  end

  private

  # Receives an array of samples, and validates metadata from a csv.
  # NOTE: validation depends on fields of each sample which depends on fields of
  # each sample project.
  # NOTE: if allow_new_host_genomes, this method will return initialized
  # new_host_genomes that pass validation.
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

    # Require a header for every column.
    if metadata["headers"].include? ""
      errors.push(MetadataValidationErrors::MISSING_COLUMN_HEADER)
      return { "errors" => errors, "warnings" => [] }
    end

    # Require sample_name or Sample Name column.
    if (metadata["headers"] & MetadataField::SAMPLE_NAME_SYNONYMS).blank?
      errors.push(MetadataValidationErrors::MISSING_SAMPLE_NAME_COLUMN)
      return { "errors" => errors, "warnings" => [] }
    end

    # Require host_organism or Host Organism column.
    if extract_host_genome_from_metadata && (metadata["headers"] & MetadataField::HOST_GENOME_SYNONYMS).blank?
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
      next if MetadataField::RESERVED_NAMES.include?(col)

      matching_field = existing_fields.select { |field| field.name == col || field.display_name == col }

      if matching_field.empty?
        warning_aggregator.add_error(:custom_field_creation, [index + 1, col])
      end
    end

    sample_name_index = metadata["headers"].find_index { |header| MetadataField::SAMPLE_NAME_SYNONYMS.include?(header) }

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
        host_genome = host_genomes.find { |cur_hg| cur_hg && cur_hg.name.casecmp?(row[host_genome_index]) }

        if host_genome.nil?
          error_aggregator.add_error(:row_invalid_host_genome, [index + 1, sample.name, row[host_genome_index]])
          next
        end

        host_age_index = metadata["headers"].find_index { |header| "Host Age".include?(header) }

        if host_genome.name == "Human" && !host_age_index.nil?
          human_age = row[host_age_index].to_i

          if human_age >= MetadataField::MAX_HUMAN_AGE
            warning_aggregator.add_error(:human_age_hipaa_compliance, [index + 1, sample.name, "≥ #{MetadataField::MAX_HUMAN_AGE}"])
          end
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
        next if MetadataField::RESERVED_NAMES.include?(field)

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
    host_genome_index = metadata["headers"].find_index { |header| MetadataField::HOST_GENOME_SYNONYMS.include?(header) }
    # same name rules as before_validation
    host_genome_names = metadata["rows"].map { |row| row[host_genome_index] }.uniq
    host_genomes = if allow_new_host_genomes
                     host_genome_names.map do |name|
                       unless name.length <= 256
                         raise StandardError, "Host name #{name} exceeds 256 characters"
                       end

                       hg = HostGenome.find_by(name: name, deprecation_status: nil) # case insensitive
                       hg ||= HostGenome.new(name: name, user: current_user)
                       # Return all found or created host genomes until this is resolved:
                       # https://jira.czi.team/browse/IDSEQ-2193.
                       new_host_genomes << hg
                       hg.valid? && hg
                     end
                   else
                     HostGenome.where(name: host_genome_names).includes(:metadata_fields)
                   end

    [host_genomes.to_a, host_genome_index, new_host_genomes]
  end
end
