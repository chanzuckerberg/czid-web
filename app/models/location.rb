class Location < ApplicationRecord
  include LocationHelper

  LOCATION_IQ_BASE_URL = "https://us1.locationiq.com/v1".freeze

  # Base request to LocationIQ API
  def self.location_api_request(endpoint_query)
    raise "No location API key" unless ENV["LOCATION_IQ_API_KEY"]

    query_url = "#{LOCATION_IQ_BASE_URL}/#{endpoint_query}&key=#{ENV['LOCATION_IQ_API_KEY']}&format=json"
    uri = URI.parse(query_url)
    request = Net::HTTP::Get.new(uri)
    resp = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    puts "in location_api_request: ", query_url, resp.body
    [resp.is_a?(Net::HTTPSuccess), JSON.parse(resp.body)]
  end

  # Search request to Location IQ API
  def self.geosearch(query)
    raise ArgumentError, "No query for geosearch" if query.blank?
    endpoint_query = "search.php?addressdetails=1&normalizecity=1&q=#{query}"
    location_api_request(endpoint_query)
  end

  # Create a Location from parameters
  def self.create_from_params(location_params)
    # Ignore fields that don't match columns
    location_params = location_params.select { |x| Location.attribute_names.index(x.to_s) }
    # Light name sanitization
    location_params.map { |_, v| v.is_a?(String) ? LocationHelper.sanitize_name(v) : v }
    Location.create!(location_params)
  rescue => err
    raise "Couldn't save Location: #{err.message} #{location_params}"
  end

  # Geosearch by OpenStreetMap ID and type
  def self.geosearch_by_osm_id(osm_id, osm_type)
    osm_type = osm_type[0].capitalize # (N)ode, (W)ay, or (R)elation
    endpoint_query = "reverse.php?osm_id=#{osm_id}&osm_type=#{osm_type}"
    location_api_request(endpoint_query)
  end

  # If we already have the location (via LocationIQ ID), return that. Otherwise fetch details via
  # OSM ID/type. OSM IDs can change often but LocationIQ IDs should be stable. We can't geosearch
  # by LocationIQ ID, so we need to use both.
  def self.find_or_create_by_api_ids(locationiq_id, osm_id, osm_type)
    existing = Location.find_by(locationiq_id: locationiq_id)
    if existing
      existing
    else
      success, resp = geosearch_by_osm_id(osm_id, osm_type)
      raise "Couldn't fetch OSM ID #{osm_id} (#{osm_type})" unless success
      puts "in find_or_create_by_api_ids: ", success
      puts "resp: ", resp

      puts "end"
      resp = LocationHelper.adapt_location_iq_response(resp)
      create_from_params(resp)
    end
  end
end
