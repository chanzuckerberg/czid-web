require 'csv'
require 'elasticsearch/model'

class Metadatum < ApplicationRecord
  include ErrorHelper
  include DateHelper
  include LocationHelper

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
    if sample.host_genome.new_record?
      # The sample's host genome may be a user-defined host genome that hasn't
      # been created yet and has no metadata fields. Add the default fields for
      # host genomes as valid keys.
      valid_keys += MetadataField.where(default_for_new_host_genome: 1).pluck(:name, :display_name).flatten
    end

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

  # Helper function of check_and_set_location_type.
  # Returns the {location_id, string_validated_value, raw_value} values that should be assigned to the metadata object.
  # Note: May create Location objects as a side effect.
  # Important assumptions:
  # The same raw_value will always cause the same response to be returned.
  # Location objects in our database may need to be created the first time a new raw_value is processed,
  # but only the first time.
  def _determine_location_params(raw_value)
    # Based on our metadata structure, the location details selected by the user will end up in
    # raw_value.
    begin
      loc = JSON.parse(raw_value, symbolize_names: true)
    rescue JSON::ParserError
      # CSV uploads will be unwrapped strings
      return {
        location_id: nil,
        string_validated_value: raw_value,
        raw_value: nil,
      }
    end

    unless loc[:locationiq_id]
      # Unresolved plain text selection (wrapped 'name')
      if loc[:name].present?
        return {
          location_id: nil,
          string_validated_value: loc[:name],
          raw_value: nil,
        }
      end
      return
    end

    # Re-fetch the location if it is specifically marked as "refetch_adjusted_location",
    # which indicates that we auto-corrected user input that was too specific
    # in the user-interface (and the user confirmed).
    location = if loc[:refetch_adjusted_location]
                 Location.refetch_adjusted_location(loc)
               else
                 # Set to existing Location or create a new one based on the external IDs. For the sake of not
                 # trusting user input, we'll potentially re-fetch location details based on the API and OSM IDs.
                 Location.find_or_new_by_fields(loc)
               end

    # If the location is too specific, reject it as invalid.
    # In theory, the user should never trigger this error, if the front-end is auto-correcting properly.
    unless Location.specificity_valid?(loc, sample.host_genome_name)
      raise "Location specificity invalid for host genome #{sample.host_genome_name} #{JSON.dump(loc)}"
    end

    unless location.id
      # Fetch and create any missing locations in the "lineage" of this location.
      # Example: for a city, make sure the state, country, etc. are also fetched.
      location = Location.check_and_fetch_parents(location)
      location.save!
    end

    return {
      location_id: location.id,
      string_validated_value: nil,
      raw_value: nil,
    }
  end

  def check_and_set_location_type
    # Skip if location was already resolved
    # admin autofill creates string_validated_value without raw_value
    return if (location_id || string_validated_value) && !raw_value

    # Increment this if you ever change the behavior of _determine_location_params or underlying functions.
    cache_version_key = 1
    cache_key = "#{raw_value}&_v=#{cache_version_key}"

    # Use a cache for this function so that, if the exact same raw location value is passed for multiple samples
    # in one request, we only validate it once, which saves time.
    # Use the raw value as the cache key.
    # Use a short cache expiration time because our current performance requirements only require this cache
    # to persist for the duration of one request.
    # A short cache expiration time mitigates the risk in case someone forgets to
    # increment the cache_version_key above when making a change.
    location_params = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
      _determine_location_params(raw_value)
    end

    # At this point, discard raw_value (too long to store anyway)
    self.raw_value = location_params[:raw_value]
    self.string_validated_value = location_params[:string_validated_value]
    self.location_id = location_params[:location_id]
  rescue StandardError => err
    LogUtil.log_error("Failed to save location metadatum: #{err.message}", exception: err)
    errors.add(:raw_value, MetadataValidationErrors::INVALID_LOCATION)
  end

  def self.str_to_basic_chars(res)
    res.downcase.gsub(/[^0-9A-Za-z]/, '')
  end

  # Bulk import safe to use with elasticsearch
  def self.bulk_import(to_create, opts = {})
    missing_ids = Set.new
    results = super(to_create, opts)
    results.failed_instances.each do |model|
      missing_ids.add(model.id)
    end
    results
  end

  def validated_value
    # Special case for Location objects
    if metadata_field.base_type == MetadataField::LOCATION_TYPE
      location_id ? Location::DEFAULT_LOCATION_FIELDS.index_with { |k| location[k] } : string_validated_value
    else
      base = MetadataField.convert_type_to_string(metadata_field.base_type)
      self["#{base}_validated_value"]
    end
  rescue StandardError
    ""
  end

  # CSV-friendly string value
  def csv_compatible_value
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
  # when use_raw_date_strings is used, date-type metadata will be returned as strings instead of Date objects.
  # Returns a hash mapping sample id to hash of metadata key to value.
  def self.by_sample_ids(sample_ids, use_raw_date_strings: false, use_csv_compatible_values: false)
    includes(:metadata_field, :location)
      .where(sample_id: sample_ids)
      .group_by(&:sample_id)
      .map do |sample_id, sample_metadata|
        [
          sample_id,
          sample_metadata.map do |m|
            # When fetching metadata for a human sample for displaying on the front-end, we want 2001-01 for dates, not 2001-01-01.
            # date_validated_value is a Date object and will show the day when converted to a string. We use the original raw_value string instead.
            if use_csv_compatible_values
              [m.key.to_sym, m.csv_compatible_value]
            elsif m.metadata_field.base_type == MetadataField::DATE_TYPE && use_raw_date_strings
              [m.key.to_sym, m.raw_value]
            else
              [m.key.to_sym, m.validated_value]
            end
          end.to_h,
        ]
      end.to_h
  end
end
