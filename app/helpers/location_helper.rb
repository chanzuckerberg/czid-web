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
end
