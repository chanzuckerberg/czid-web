class Location < ApplicationRecord
  include LocationHelper

  LOCATION_IQ_BASE_URL = "https://us1.locationiq.com/v1".freeze
  GEOSEARCH_BASE_QUERY = "search.php?addressdetails=1&normalizecity=1".freeze

  # Base request to LocationIQ API
  def self.location_api_request(endpoint_query)
    raise "No location API key" unless ENV["LOCATION_IQ_API_KEY"]

    query_url = "#{LOCATION_IQ_BASE_URL}/#{endpoint_query}&key=#{ENV['LOCATION_IQ_API_KEY']}&format=json"
    uri = URI.parse(query_url)
    request = Net::HTTP::Get.new(uri)
    resp = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    [resp.is_a?(Net::HTTPSuccess), JSON.parse(resp.body)]
  end

  # Search request to Location IQ API by freeform query
  def self.geosearch(query)
    raise ArgumentError, "No query for geosearch" if query.blank?
    endpoint_query = "#{GEOSEARCH_BASE_QUERY}&q=#{query}"
    location_api_request(endpoint_query)
  end

  # Search request to Location IQ API by country and state
  def self.geosearch_by_country_and_state(country_name, state_name)
    endpoint_query = "#{GEOSEARCH_BASE_QUERY}&country=#{country_name}&state=#{state_name}"
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

      resp = LocationHelper.adapt_location_iq_response(resp)
      create_from_params(resp)
    end
  end

  # Restrict Human location specificity to State, Country. Return new Location if restriction added.
  def self.check_and_restrict_specificity(location, host_genome_name)
    # We don't want Human locations with subdivision or city
    if host_genome_name == "Human" && (location.subdivision_name.present? || location.city_name.present?)
      # Redo the search for just the country/state
      success, resp = geosearch_by_country_and_state(location.country_name, location.state_name)
      unless success
        raise "Couldn't find #{location.state_name}, #{location.country_name} (state, country)"
      end

      result = LocationHelper.adapt_location_iq_response(resp[0])
      existing = Location.find_by(locationiq_id: result[:locationiq_id])
      new_location = existing ? existing : create_from_params(result)

      # Delete the overly specific location if not used anymore
      location.delete if Metadatum.where(location: location).empty?
    else
      new_location = location
    end

    new_location
  end
end
