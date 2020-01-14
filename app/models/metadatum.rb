require 'csv'
require 'elasticsearch/model'

class Metadatum < ApplicationRecord
  include ErrorHelper
  include DateHelper
  include LocationHelper

  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks
  end

  Client = Aws::S3::Client.new

  # ActiveRecord related
  belongs_to :sample
  belongs_to :metadata_field
  belongs_to :location, optional: true

  # Validations
  validates :string_validated_value, length: { maximum: 250 }
  validates :number_validated_value, numericality: true, allow_nil: true
  validate :set_validated_values

  # Additional ActiveRecord field documentation:
  #
  # Every piece of metadata will belong to a type of metadata_field
  # add_reference :metadata, :metadata_field

  # Custom validator called on save or update. Writes to the *_validated_value column.
  def set_validated_values
    # Fail if sample resolves to nil (probably a deleted sample)
    # TODO: Replace this with MetadataField validators
    unless sample
      errors.add(:sample_not_found, MetadataValidationErrors::SAMPLE_NOT_FOUND)
      return
    end

    # Check if the key is valid. Metadata_field was supposed to be set.
    valid_keys = sample.host_genome.metadata_fields.pluck(:name, :display_name).flatten
    unless key && valid_keys.include?(key) && metadata_field
      errors.add(:invalid_field_for_host_genome, MetadataValidationErrors::INVALID_FIELD_FOR_HOST_GENOME)
      return
    end

    base = MetadataField.convert_type_to_string(metadata_field.base_type)
    public_send("check_and_set_#{base}_type")
  end

  # Called by set_validated_values custom validator
  def check_and_set_string_type
    if metadata_field && metadata_field.force_options == 1
      matched = false
      JSON.parse(metadata_field.options || "[]").each do |opt|
        if Metadatum.str_to_basic_chars(raw_value) == Metadatum.str_to_basic_chars(opt)
          # Ex: Match 'neb ultra-iifs dna' to 'NEB Ultra II FS DNA'
          # Ex: Match '30-day mortality' to "30 Day Mortality"
          self.string_validated_value = opt
          matched = true
          break
        end
      end
      unless matched
        errors.add(:raw_value, MetadataValidationErrors::INVALID_OPTION)
      end
    else
      self.string_validated_value = raw_value
    end
  end

  def check_and_set_number_type
    # If the raw-value doesn't match a number regex.
    # This regex matches things like +0.2. Plus or minus, one or more digits, an optional decimal, and more digits.
    if /\A[+-]?\d+(\.\d+)?\z/.match(raw_value).nil?
      errors.add(:raw_value, MetadataValidationErrors::INVALID_NUMBER)
    else
      # to_d will convert "abc" to 0.0, so we need the regex
      val = raw_value.to_d
      # Larger numbers will cause mysql error.
      if val >= (10**27) || val <= (-10**27)
        errors.add(:raw_value, MetadataValidationErrors::NUMBER_OUT_OF_RANGE)
      else
        self.number_validated_value = val
      end
    end
  rescue ArgumentError
    errors.add(:raw_value, MetadataValidationErrors::INVALID_NUMBER)
  end

  def check_and_set_date_type
    # Only allow day in the date if host genome is not Human.
    self.date_validated_value = parse_date(raw_value, sample.host_genome_name != "Human")
  rescue ArgumentError
    errors.add(:raw_value, MetadataValidationErrors::INVALID_DATE)
  end

  def check_and_set_location_type
    # Skip if location was already resolved
    return if location_id && !raw_value

    # Based on our metadata structure, the location details selected by the user will end up in
    # raw_value.
    begin
      loc = JSON.parse(raw_value, symbolize_names: true)
    rescue JSON::ParserError
      # CSV uploads will be unwrapped strings
      self.string_validated_value = raw_value
      self.location_id = nil
      return
    end

    unless loc[:locationiq_id]
      # Unresolved plain text selection (wrapped 'name')
      if loc[:name].present?
        self.string_validated_value = loc[:name]
        self.location_id = nil
      end
      return
    end

    # Set to existing Location or create a new one based on the external IDs. For the sake of not
    # trusting user input, we'll potentially re-fetch location details based on the API and OSM IDs.
    location = Location.check_and_restrict_specificity(loc, sample.host_genome_name)
    unless location.is_a?(Location)
      location = Location.find_or_new_by_fields(loc)
    end
    unless location.id
      location = Location.check_and_fetch_parents(location)
      location.save!
    end

    # At this point, discard raw_value (too long to store anyway)
    self.raw_value = nil
    self.string_validated_value = nil
    self.location_id = location.id
  rescue => err
    LogUtil.log_err_and_airbrake("Failed to save location metadatum: #{err.message}")
    LogUtil.log_backtrace(err)
    errors.add(:raw_value, MetadataValidationErrors::INVALID_LOCATION)
  end

  def self.str_to_basic_chars(res)
    res.downcase.gsub(/[^0-9A-Za-z]/, '')
  end

  # Load bulk metadata from a CSV file from S3
  def self.bulk_load_from_s3_csv(path)
    csv_data = get_s3_csv(path)
    to_create, errors = bulk_load_prepare(csv_data)
    errors += bulk_load_import(to_create)
    bulk_log_errors(errors)
  end

  # Construct objects to create without saving.
  def self.bulk_load_prepare(csv_data)
    to_create = []
    errors = []
    csv_data.each_with_index do |row, index|
      begin
        to_create += load_csv_single_sample_row(row, index)
      rescue => err
        # Catch ArgumentError for proj and sample, other errors
        errors << err.message
      end
    end
    [to_create, errors]
  end

  # Create the object instances with activerecord-import. Still uses the
  # validations.
  def self.bulk_load_import(to_create)
    errors = []
    begin
      # The unique key is on sample and metadata.key, so the value fields will
      # be updated if the key exists.
      update_keys = [:raw_value, :string_validated_value, :number_validated_value, :date_validated_value, :location_id]
      results = Metadatum.import to_create, on_duplicate_key_update: update_keys
      results.failed_instances.each do |model|
        # Show the errors from ActiveRecord
        msg = model.errors.full_messages[0]
        errors << "#{model.key}: #{msg}"
      end
    rescue => err
      # Record other errors
      errors << err.message
    end
    errors
  end

  def self.bulk_log_errors(errors)
    unless errors.empty?
      msg = errors.join(".\n")
      Rails.logger.error(msg)
      errors
    end
  end

  # Load CSV file from S3. Raise RuntimeError on download fail.
  def self.get_s3_csv(path)
    parts = path.split("/", 4)
    bucket = parts[2]
    key = parts[3]
    begin
      resp = Client.get_object(bucket: bucket, key: key)
      csv_data = resp.body.read
    rescue => err
      raise "Error in loading S3 file. #{err.message}"
    end

    # Remove BOM if present (file likely comes from Excel)
    csv_data = csv_data.delete("\uFEFF")
    csv_data = CSV.parse(csv_data, headers: true)
    csv_data
  end

  # Load metadata from a single CSV row corresponding to one sample.
  # Return the Metadatum to create without saving.
  def self.load_csv_single_sample_row(row, index)
    # Setup
    to_create = []
    row = row.to_h
    proj = load_csv_project(row, index)
    sample = load_csv_sample(row, index, proj)

    # Add or update Metadata items
    done_keys = [:study_id, :project_name, :sample_name]
    row.each do |key, value|
      next unless key && value
      # Strip whitespace and ensure symbol
      key = key.to_s.strip.to_sym
      next if done_keys.include?(key)
      to_create << new_without_save(sample, key, value)
    end

    to_create
  end

  # Get the project for the CSV row
  def self.load_csv_project(row, index)
    proj_name = row['study_id'] || row['project_name']
    unless proj_name
      raise ArgumentError, "No project name found in row #{index + 2}"
    end
    proj = Project.find_by(name: proj_name)
    unless proj
      raise ArgumentError, "No project found named #{proj_name}"
    end
    proj
  end

  # Get the sample for the CSV row
  def self.load_csv_sample(row, index, proj)
    sample_name = row['sample_name']
    unless sample_name
      raise ArgumentError, "No sample name found in row #{index + 2}"
    end
    sample = Sample.find_by(project: proj, name: sample_name)
    unless sample
      raise ArgumentError, "No sample found named #{sample_name} in #{proj.name}"
    end
    sample
  end

  # Make a new Metadatum instance without saving/creating.
  def self.new_without_save(sample, key, value)
    key = key.to_sym
    m = Metadatum.new
    m.metadata_field = MetadataField.find_by(name: key) || MetadataField.find_by(display_name: key)
    m.key = m.metadata_field ? m.metadata_field.name : nil
    m.raw_value = value.is_a?(ActionController::Parameters) ? value.to_json : value
    # *_validated_value field is set in the set_validated_values validator.
    m.sample = sample
    m
  end

  def validated_value
    # Special case for Location objects
    if metadata_field.base_type == MetadataField::LOCATION_TYPE
      location_id ? Hash[Location::DEFAULT_LOCATION_FIELDS.map { |k| [k, location[k]] }] : string_validated_value
    else
      base = MetadataField.convert_type_to_string(metadata_field.base_type)
      self["#{base}_validated_value"]
    end
  rescue
    ""
  end

  def self.validated_value_multiget(metadata)
    metadata_fields = MetadataField.where(id: metadata.pluck(:metadata_field_id)).index_by(&:id)
    validated_values = {}
    metadata.each do |md|
      mdf = metadata_fields[md.metadata_field_id]
      if mdf
        base = MetadataField.convert_type_to_string(mdf.base_type)
        validated_values[md.id] = md["#{base}_validated_value"]
      else
        validated_values[md.id] = ""
      end
    end
    validated_values
  end

  # CSV-friendly string value for filling metadata templates
  def csv_template_value
    # Special case for Location objects
    if metadata_field.base_type == MetadataField::LOCATION_TYPE
      location_id ? location.name : string_validated_value
    else
      # Use raw_value, the user's original string input, to avoid conversion errors with
      # dates/numbers.
      raw_value
    end
  end

  # use_raw_date_strings is used to show 2001-01 instead of 2001-01-01 for human samples.
  # when use_raw_date_string is used, date-type metadata will be returned as strings instead of Date objects.
  def self.by_sample_ids(sample_ids, use_raw_date_strings: false)
    includes(:metadata_field, :location)
      .where(sample_id: sample_ids)
      .group_by(&:sample_id)
      .map do |sample_id, sample_metadata|
        [
          sample_id,
          sample_metadata.map do |m|
            # When fetching metadata for a human sample for displaying on the front-end, we want 2001-01 for dates, not 2001-01-01.
            # date_validated_value is a Date object and will show the day when converted to a string. We use the original raw_value string instead.
            if m.metadata_field.base_type == MetadataField::DATE_TYPE && use_raw_date_strings
              [m.key.to_sym, m.raw_value]
            else
              [m.key.to_sym, m.validated_value]
            end
          end.to_h,
        ]
      end.to_h
  end
end
