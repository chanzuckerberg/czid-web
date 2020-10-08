module LocationHelper
  # Adapter function to munge responses from Location IQ API to our format
  def self.adapt_location_iq_response(body)
    address = body["address"]
    # Note(jsheu): 'type' field may contain a helpful exact name match, but not
    # necessarily. Ex: city, state, administrative, river, university, station..
    category = body["type"]

    country_key = Location::COUNTRY_NAMES.find { |k| address.include?(k) || k == category }
    state_key = Location::STATE_NAMES.find { |k| address.include?(k) || k == category }
    subdivision_key = Location::SUBDIVISION_NAMES.find { |k| address.include?(k) || k == category }
    city_key = Location::CITY_NAMES.find { |k| address.key?(k) || k == category }

    geo_level = if city_key
                  Location::CITY_LEVEL
                elsif subdivision_key
                  Location::SUBDIVISION_LEVEL
                elsif state_key
                  Location::STATE_LEVEL
                elsif country_key
                  Location::COUNTRY_LEVEL
                else
                  ""
                end

    name = normalize_location_name(body["display_name"], geo_level)
    country_name = normalize_location_name(address[country_key] || "", Location::COUNTRY_LEVEL)
    state_name = normalize_location_name(address[state_key] || "", Location::STATE_LEVEL)
    subdivision_name = normalize_location_name(address[subdivision_key] || "", Location::SUBDIVISION_LEVEL)
    city_name = normalize_location_name(address[city_key] || "", Location::CITY_LEVEL)

    loc = {
      name: name,
      geo_level: geo_level,
      country_name: country_name,
      state_name: state_name,
      subdivision_name: subdivision_name,
      city_name: city_name,
      # Round coordinates to enhance privacy
      lat: body["lat"] ? body["lat"].to_f.round(2) : nil,
      # LocationIQ uses 'lon'
      lng: body["lon"] ? body["lon"].to_f.round(2) : nil,
      country_code: address["country_code"] || "",
      osm_id: body["osm_id"].to_i,
      osm_type: body["osm_type"] || "",
      locationiq_id: body["place_id"].to_i,
    }

    if loc[:name].size > Location::DEFAULT_MAX_NAME_LENGTH && address.present?
      # The first field in the address response may have a useful place name like 'university'
      parts = [address.first[1]]
      fields = [:city_name, :subdivision_name, :state_name, :country_name]
      parts += fields.map { |f| loc[f].presence }.compact
      loc[:name] = parts.uniq.join(", ")
    end

    loc
  end

  # Light sanitization with SQL/HTML/JS injections in mind
  def self.sanitize_name(name)
    name.gsub(%r{[;%_^<>\/?\\]}, "")
  end

  # TODO(jsheu): Remove this if the name shortening in adapt_location_iq_response is sufficient.
  def self.truncate_name(name)
    # Shorten long names so they look a little better downstream (e.g. in dropdown filters). Try to take the first 2 + last 2 parts, or just the first + last 2 parts.
    max_chars = Location::DEFAULT_MAX_NAME_LENGTH
    if name && name.size > max_chars
      parts = name.split(", ")
      if parts.size >= 4
        last = parts[-2..-1]
        name = parts[0..1].concat(last).join(", ")
        if name.size > max_chars
          name = [parts[0]].concat(last).join(", ")
        end
      end
    end
    name
  end

  def self.sample_dimensions(sample_ids, field_name, samples_count)
    # See pattern in SamplesController dimensions
    locations = SamplesHelper.samples_by_metadata_field(sample_ids, field_name).count
    locations = locations.map do |loc, count|
      location = loc.is_a?(Array) ? (loc[0] || loc[1]) : loc
      parents = loc.is_a?(Array) ? loc[2..-1].compact[0..-2] : []
      { value: location, text: truncate_name(location), count: count, parents: parents }
    end
    not_set_count = samples_count - locations.sum { |l| l[:count] }
    if not_set_count > 0
      locations << { value: "not_set", text: "Unknown", count: not_set_count }
    end
    return locations
  end

  def self.project_dimensions(sample_ids, field_name)
    # See pattern in ProjectsController dimensions
    locations = SamplesHelper
                .samples_by_metadata_field(sample_ids, field_name)
                .includes(:sample)
                .distinct
                .count(:project_id)
    locations.map do |loc, count|
      location = loc.is_a?(Array) ? (loc[0] || loc[1]) : loc
      parents = loc.is_a?(Array) ? loc[2..-1].compact[0..-2] : []
      { value: location, text: truncate_name(location), count: count, parents: parents }
    end
  end

  def self.filter_by_name(samples_with_metadata, query)
    locations_by_geo_level = Location
                             .where(name: query)
                             .pluck(:id, :geo_level)
                             .group_by { |(_, geo_level)| geo_level }
                             .map { |field, values| [field, values.map { |id| id[0] }] }
                             .to_h

    samples = samples_with_metadata.includes(metadata: :location)
    # Plain text locations in string_validated_value + multi-geo-level location search
    if locations_by_geo_level.present?
      samples.where(
        "`metadata`.`string_validated_value` IN (BINARY ?)"\
      " OR #{locations_by_geo_level.keys.map { |k| "`locations`.`#{k}_id` IN (?)" }.join(' OR ')}",
        query,
        *locations_by_geo_level.values
      )
    else
      samples.where("`metadata`.`string_validated_value` IN (BINARY ?)", query)
    end
  end

  # Normalize some location names from the provider for matching consistency.
  # Ex: Treat "United States of America" and "USA" as the same in cases where
  # the provider is not internally consistent.
  # This is for matching names that should be the same.
  #
  # See config/initializers/location_name_aliases.rb and add important known
  # aliases there.
  def self.normalize_location_name(name, geo_level)
    # NOTE(jsheu): Provider v1/autocomplete endpoint often has repetitive
    # country names such as "Cambodia, Cambodia". Dedupe them.
    if name.include?(", ")
      parts = name.split(", ")
      if parts[1] == parts[0]
        name = parts[0]
      end
    end

    if LOCATION_NAME_ALIASES.dig(geo_level, name)
      LOCATION_NAME_ALIASES[geo_level][name]
    else
      name
    end
  end

  # Combine results from provider autocomplete and geosearch endpoints for
  # better results.
  def self.handle_external_search_results(results)
    autocomplete_results = results[Location::GEOSEARCH_ACTIONS[0]] || []
    search_results = results[Location::GEOSEARCH_ACTIONS[1]] || []
    combined = ArrayUtil.merge_arrays(autocomplete_results, search_results)

    # - NOTE(jsheu): We get much more relevant results for our use cases from
    # the 'relation' type, although we don't have a way to solely request those.
    # OSM relations are used to model logical or geographic relationships
    # between objects.
    # - De-dup by name/geo_level and also osm_id.
    combined
      .map { |r| adapt_location_iq_response(r) }
      .select { |r| Location::OSM_SEARCH_TYPES_TO_USE.include?(r[:osm_type]) }
      .uniq { |r| [r[:name], r[:geo_level]] }
      .uniq { |r| r[:osm_id] }
  end
end
