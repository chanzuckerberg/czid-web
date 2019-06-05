module LocationHelper
  # Adapter function to munge responses from Location IQ API to our format
  def self.adapt_location_iq_response(body)
    address = body["address"]
    geo_level = ["city", "county", "state", "country"].each do |n|
      break n if address[n]
    end || ""
    {
      name: body["display_name"],
      geo_level: geo_level,
      country_name: address["country"] || "",
      state_name: address["state"] || "",
      subdivision_name: address["county"] || "",
      city_name: address["city"] || "",
      # Round coordinates to enhance privacy
      lat: body["lat"] ? body["lat"].to_f.round(2) : nil,
      # LocationIQ uses 'lon'
      lng: body["lon"] ? body["lon"].to_f.round(2) : nil,
      country_code: address["country_code"] || "",
      osm_id: body["osm_id"].to_i,
      osm_type: body["osm_type"],
      locationiq_id: body["place_id"].to_i
    }
  end

  # Light sanitization with SQL/HTML/JS injections in mind
  def self.sanitize_name(name)
    name.gsub(%r{[;%_^<>\/?\\]}, "")
  end

  def self.dimensions(sample_ids, field_name, samples_count)
    # See pattern in SamplesController#dimensions
    locations = SamplesHelper.samples_by_metadata_field(sample_ids, field_name).count
    locations = locations.map do |location, count|
      loc = location.is_a?(Array) ? (location[0] || location[1]) : location
      { value: loc, text: loc, count: count }
    end
    not_set_count = samples_count - locations.sum { |l| l[:count] }
    if not_set_count > 0
      locations << { value: "not_set", text: "Unknown", count: not_set_count }
    end
    locations
  end
end
