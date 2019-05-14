class Location < ApplicationRecord
  include LocationHelper

  def self.location_api_request(endpoint_query)
    raise "No location API key" unless ENV["LOCATION_IQ_API_KEY"]

    query_url = "https://us1.locationiq.com/v1/#{endpoint_query}&key=#{ENV['LOCATION_IQ_API_KEY']}"
    uri = URI.parse(query_url)
    request = Net::HTTP::Get.new(uri)
    resp = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
      http.request(request)
    end
    [resp.is_a?(Net::HTTPSuccess), JSON.parse(resp.body)]
  end

  # Search request to Location IQ API
  def self.geosearch(query)
    raise ArgumentError, "No query for geosearch" if query.blank?
    endpoint_query = "search.php?format=json&addressdetails=1&normalizecity=1&q=#{query}"
    location_api_request(endpoint_query)
  end

  def self.find_from_params(location_params)
    # Consider the location to already exist if it matches all these fields
    key_fields = [:name, :geo_level, :country_name, :state_name, :subdivision_name, :city_name, :lat, :lng]
    Location.find_by(key_fields.map { |f| [f, location_params[f]] }.to_h)
  end

  def self.create_from_params(location_params)
    # Ignore fields that don't match columns
    location_params = location_params.select { |x| Location.attribute_names.index(x.to_s) }
    Location.create!(location_params)
  rescue => err
    raise "Couldn't save Location: #{err.message} #{location_params}"
  end

  def self.find_or_create_from_params(location_params)
    existing = find_from_params(location_params)
    if existing
      existing
    else
      create_from_params(location_params)
    end
  end

  def self.geosearch_by_osm_id(osm_id, osm_type)
    osm_type = osm_type[0].capitalize # (N)ode, (W)ay, or (R)elation
    endpoint_query = "reverse.php?osm_id=#{osm_id}&osm_type=#{osm_type}&format=json"
    location_api_request(endpoint_query)
  end

  # Find or create a location based on LocationIQ ID and OSM ID. OSM IDs can change often but
  # LocationIQ IDs should be stable. We can't geosearch by LocationIQ ID, so we need to use both.
  def self.find_or_create_by_api_ids(locationiq_id, osm_id, osm_type)
    existing = Location.find_by(locationiq_id: locationiq_id)
    if existing
      existing
    else
      success, resp = geosearch_by_osm_id(osm_id, osm_type)
      raise "Couldn't fetch OSM ID #{osm_id} (#{osm_type})" unless success

      resp = LocationHelper.adapt_location_iq_response(resp)
      find_or_create_from_params(resp)
    end
  end
end
