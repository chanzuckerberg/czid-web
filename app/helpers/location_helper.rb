module LocationHelper
  # Adapter function to munge responses from Location IQ API to our format
  def self.adapt_location_iq_response(body)
    addr = body["address"]
    geo_level = ["city", "county", "state", "country"].each do |n|
      break n if addr[n]
    end || ""
    {
      name: body["display_name"],
      geo_level: geo_level,
      country_name: addr["country"] || "",
      state_name: addr["state"] || "",
      subdivision_name: addr["county"] || "",
      # Normalize extra provider fields to city. normalizecity param doesn't work all the time.
      city_name: addr[%w[city city_distrct locality town borough municipality village hamlet quarter neighbourhood state_district].find { |k| addr.key?(k) }] || "",
      # Round coordinates to enhance privacy
      lat: body["lat"] ? body["lat"].to_f.round(2) : nil,
      # LocationIQ uses 'lon'
      lng: body["lon"] ? body["lon"].to_f.round(2) : nil,
      country_code: addr["country_code"] || "",
      osm_id: body["osm_id"].to_i,
      osm_type: body["osm_type"],
      locationiq_id: body["place_id"].to_i
    }
  end

  # Light sanitization with SQL/HTML/JS injections in mind
  def self.sanitize_name(name)
    name.gsub(%r{[;%_^<>\/?\\]}, "")
  end

  def self.truncate_name(name)
    # Shorten long names so they look a little better downstream (e.g. in dropdown filters). Try to take the first 2 + last 2 parts, or just the first + last 2 parts.
    max_chars = 30
    if name.size > max_chars
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
      { value: location, text: truncate_name(location), count: count }
    end
    not_set_count = samples_count - locations.sum { |l| l[:count] }
    if not_set_count > 0
      locations << { value: "not_set", text: "Unknown", count: not_set_count }
    end
    locations
  end

  def self.project_dimensions(sample_ids, field_name)
    # See pattern in ProjectsController dimensions
    locations = SamplesHelper.samples_by_metadata_field(sample_ids, field_name)
                             .includes(:sample)
                             .distinct
                             .count(:project_id)
    locations.map do |loc, count|
      location = loc.is_a?(Array) ? (loc[0] || loc[1]) : loc
      { value: location, text: truncate_name(location), count: count }
    end
  end

  def self.filter_by_name(samples_with_metadata, query)
    samples = samples_with_metadata.includes(metadata: :location)
    # Plain text locations in string_validated_value
    samples.where(metadata: { string_validated_value: query })
           .or(samples.where(metadata: { locations: { name: query } }))
  end
end
