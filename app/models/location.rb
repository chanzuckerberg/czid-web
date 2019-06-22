class Location < ApplicationRecord
  include LocationHelper

  LOCATION_IQ_BASE_URL = "https://us1.locationiq.com/v1".freeze
  GEOSEARCH_BASE_QUERY = "search.php?addressdetails=1&normalizecity=1".freeze
  DEFAULT_LOCATION_FIELDS = [
    :name,
    :geo_level,
    :country_name,
    :state_name,
    :subdivision_name,
    :city_name,
    :lat,
    :lng
  ].freeze
  DEFAULT_MAX_NAME_LENGTH = 30

  COUNTRY_LEVEL = "country".freeze
  STATE_LEVEL = "state".freeze
  SUBDIVISION_LEVEL = "subdivision".freeze

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

  # Search request to Location IQ API by country, state, and subdivision (or left subset)
  def self.geosearch_by_levels(country_name, state_name = "", subdivision_name = "")
    # Note: Don't use field="" because provider results differ vs. not including the param at all.
    endpoint_query = "#{GEOSEARCH_BASE_QUERY}&country=#{country_name}"
    endpoint_query += "&state=#{state_name}" if state_name.present?
    endpoint_query += "&county=#{subdivision_name}" if subdivision_name.present?
    location_api_request(endpoint_query)
  end

  # Instantiate a new Location from parameters WITHOUT saving
  def self.new_from_params(location_params)
    # Ignore fields that don't match columns
    location_params = location_params.select { |x| Location.attribute_names.index(x.to_s) }
    # Light name sanitization
    location_params.map { |_, v| v.is_a?(String) ? LocationHelper.sanitize_name(v) : v }
    Location.new(location_params)
  rescue => err
    raise "Couldn't make new Location: #{err.message} #{location_params}"
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
  def self.find_or_new_by_api_ids(locationiq_id, osm_id, osm_type)
    existing = Location.find_by(locationiq_id: locationiq_id)
    if existing
      existing
    else
      success, resp = geosearch_by_osm_id(osm_id, osm_type)
      raise "Couldn't fetch OSM ID #{osm_id} (#{osm_type})" unless success

      resp = LocationHelper.adapt_location_iq_response(resp)
      # 'New' without saving so make sure caller saves.
      new_from_params(resp)
    end
  end

  # Restrict Human location specificity to Subdivision, State, Country. Return new Location if
  # restriction added.
  def self.check_and_restrict_specificity(location, host_genome_name)
    # We don't want Human locations with city
    if host_genome_name == "Human" && location.city_name.present?
      # Redo the search for just the subdivision/state/country
      success, resp = geosearch_by_levels(location.country_name, location.state_name, location.subdivision_name)
      unless success && !resp.empty?
        raise "Couldn't find #{location.country_name}, #{location.state_name}, #{location.subdivision_name} (country, state, subdivision)"
      end

      result = LocationHelper.adapt_location_iq_response(resp[0])
      location = Location.find_by(locationiq_id: result[:locationiq_id]) || new_from_params(result)
    end

    location
  end

  def self.check_and_fetch_parents(location)
    # Do a fetch for the missing levels
    missing_parents = missing_parent_levels(location)
    missing_parents.each do |level|
      if level == COUNTRY_LEVEL
        success, resp = geosearch_by_levels(location.country_name)
      else
        success, resp = geosearch_by_levels(location.country_name, location.state_name)
      end

      unless success && !resp.empty?
        query = "#{location.country_name} #{level == STATE_LEVEL ? location.state_name : nil}"
        raise "Geosearch for parent level failed: #{query}"
      end

      result = LocationHelper.adapt_location_iq_response(resp[0])
      new_location = new_from_params(result)
      new_location.save!
      new_location.update_attribute("#{level}_id", new_location.id)
      location["#{level}_id"] = new_location.id
    end

    # Need to also set the other one's country_id or state_id. Which means doing the country one first.

    location["#{location.geo_level}_id"] = location.id
    location.save!
  end

  def self.missing_parent_levels(location)
    return [] if location.geo_level == COUNTRY_LEVEL

    # Find if the country or state level is missing
    country_match = Location.where(
      geo_level: COUNTRY_LEVEL,
      country_name: location.country_name
    )
    state_match = Location.where(
      geo_level: STATE_LEVEL,
      country_name: location.country_name,
      state_name: location.state_name
    )
    parents = [country_match]
    if location.geo_level != STATE_LEVEL
      # Even for levels below State, clustering is only at the State and Country levels for now.
      parents << state_match
    end
    present_parents = parents.inject(:or).pluck(:geo_level)

    missing_parents = [COUNTRY_LEVEL, STATE_LEVEL]
    missing_parents.delete(location.geo_level)
    missing_parents.delete(COUNTRY_LEVEL) if location.country_name == ""
    missing_parents.delete(STATE_LEVEL) if location.state_name == ""
    missing_parents -= present_parents
    missing_parents
  end
end
