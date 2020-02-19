class Location < ApplicationRecord
  include LocationHelper
  belongs_to :country, class_name: "Location", optional: true
  belongs_to :state, class_name: "Location", optional: true
  belongs_to :subdivision, class_name: "Location", optional: true
  belongs_to :city, class_name: "Location", optional: true

  # Lat and lng may be null if the location provider is missing coordinates, as
  # opposed to placing a location at (0,0)
  validates :lat, inclusion: -90..90, allow_nil: true, if: :mass_validation_enabled?
  validates :lng, inclusion: -180..180, allow_nil: true, if: :mass_validation_enabled?
  validates :osm_id, presence: true, if: :mass_validation_enabled?
  validates :locationiq_id, presence: true, if: :mass_validation_enabled?

  LOCATION_IQ_BASE_URL = "https://us1.locationiq.com/v1".freeze
  GEOSEARCH_BASE_QUERY = "search.php?addressdetails=1&normalizecity=1".freeze
  AUTOCOMPLETE_BASE_QUERY = "autocomplete.php?normalizecity=1".freeze
  DEFAULT_LOCATION_FIELDS = [
    :name,
    :geo_level,
    :country_name,
    :state_name,
    :subdivision_name,
    :city_name,
    :lat,
    :lng,
    :country_id,
    :state_id,
    :subdivision_id,
    :city_id,
  ].freeze
  DEFAULT_MAX_NAME_LENGTH = 30

  COUNTRY_LEVEL = "country".freeze
  STATE_LEVEL = "state".freeze
  SUBDIVISION_LEVEL = "subdivision".freeze
  CITY_LEVEL = "city".freeze
  GEO_LEVELS = [COUNTRY_LEVEL, STATE_LEVEL, SUBDIVISION_LEVEL, CITY_LEVEL].freeze

  # See https://wiki.openstreetmap.org/wiki/Key:place
  # Normalize extra provider fields to each of our levels.
  COUNTRY_NAMES = %w[country].freeze
  STATE_NAMES = %w[state province region].freeze
  SUBDIVISION_NAMES = %w[county state_district district].freeze
  CITY_NAMES = %w[city city_distrct locality town borough municipality village hamlet quarter neighbourhood suburb].freeze

  GEOSEARCH_ACTIONS = [:autocomplete, :geosearch].freeze
  OSM_SEARCH_TYPES_TO_USE = %w[relation].freeze

  # Base request to LocationIQ API
  def self.location_api_request(endpoint_query)
    raise "No location API key" unless ENV["LOCATION_IQ_API_KEY"]

    query_url = "#{LOCATION_IQ_BASE_URL}/#{endpoint_query}&key=#{ENV['LOCATION_IQ_API_KEY']}&format=json"
    uri = URI.parse(URI.escape(query_url))
    request = Net::HTTP::Get.new(uri)
    resp = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    # Search with 0 results will return HTTPNotFound. Consider it a successful request for our handling.
    success = resp.is_a?(Net::HTTPSuccess) || resp.is_a?(Net::HTTPNotFound)
    [success, JSON.parse(resp.body)]
  end

  # Search request to Location IQ API by freeform query.
  # - This endpoint is better for when the user has finished typing entirely and
  # wants an exact match (e.g. "San Diego" -> "San Diego" and nothing more).
  # - This endpoint is worse for when the user only typed a partial phrase. Ex:
  # "San" may only return locations named "San" instead of suggesting "San
  # Diego".
  def self.geosearch(query, limit = nil)
    geo_search_request_base(:geosearch, query, limit)
  end

  # - This endpoint is better for when the user is still typing, so it will return
  # results with additional characters (e.g. "San" -> "San Francisco").
  # - This endpoint is worse if the user is finished typing. Ex: "UCSF" may only
  # return "UCSF Medical Center" (and not plain "UCSF") because it is trying to
  # guess what the completed phrase will be.
  def self.autocomplete(query, limit = nil)
    geo_search_request_base(:autocomplete, query, limit)
  end

  def self.geo_search_request_base(action, query, limit = nil)
    raise ArgumentError, "No query for #{action}" if query.blank?
    base_query = if action == :autocomplete
                   AUTOCOMPLETE_BASE_QUERY
                 else
                   GEOSEARCH_BASE_QUERY
                 end
    endpoint_query = "#{base_query}&q=#{query}"
    endpoint_query += "&limit=#{limit}" if limit.present?
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

  # If we already have the location (via matching fields), return that. Otherwise fetch details via
  # OSM ID/type.
  def self.find_or_new_by_fields(loc_info)
    existing = Location.find_with_fields(loc_info)
    if existing
      existing
    elsif loc_info[:osm_id].to_i > 0 && loc_info[:osm_type]
      # Warning: OSM IDs may change, but it is OK to do a service lookup with them.
      success, resp = geosearch_by_osm_id(loc_info[:osm_id], loc_info[:osm_type])
      raise "Couldn't fetch OSM ID #{loc_info[:osm_id]} (#{loc_info[:osm_type]})" unless success

      resp = LocationHelper.adapt_location_iq_response(resp)
      # 'New' without saving so make sure caller saves.
      new_from_params(resp)
    else
      # If osm_id and osm_type are missing, just use the original params.
      # 'New' without saving so make sure caller saves.
      new_from_params(loc_info)
    end
  end

  # Consider it a match if all fields to refer to the same place.
  def self.find_with_fields(loc_info)
    Location.find_by(
      name: loc_info[:name] || "",
      geo_level: loc_info[:geo_level] || "",
      country_name: loc_info[:country_name] || "",
      state_name: loc_info[:state_name] || "",
      subdivision_name: loc_info[:subdivision_name] || "",
      city_name: loc_info[:city_name] || ""
    )
  end

  # Restrict Human location specificity to Subdivision, State, Country. Return new Location if
  # restriction added.
  def self.check_and_restrict_specificity(location, host_genome_name)
    # We don't want Human locations with city
    if host_genome_name == "Human" && location[:city_name].present?
      # Return our existing entry if found
      existing = Location.find_by(
        country_name: location[:country_name],
        state_name: location[:state_name],
        subdivision_name: location[:subdivision_name],
        city_name: ""
      )
      return existing if existing

      # Redo the search for just the subdivision/state/country
      success, resp = geosearch_by_levels(
        location[:country_name],
        location[:state_name],
        location[:subdivision_name]
      )
      unless success && !resp.empty?
        raise "Couldn't find #{location[:country_name]}, #{location[:state_name]}, #{location[:subdivision_name]} (country, state, subdivision)"
      end

      result = LocationHelper.adapt_location_iq_response(resp[0])
      return Location.find_with_fields(result) || new_from_params(result)
    end

    # Just return the input hash if no change
    location
  end

  # Note: We are clustering at Country+State for now so Subdivision+City ids may be nil.
  def self.check_and_fetch_parents(location)
    present_parent_level_ids, missing_parent_levels = present_and_missing_parents(location)
    location.save! unless location.id
    present_parent_level_ids[location.geo_level] = location.id

    missing_parent_levels.each do |level|
      # Geosearch for the missing parents
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

      # Set id fields
      present_parent_level_ids[level] = new_location.id
      new_location = set_parent_ids(new_location, present_parent_level_ids)
      new_location.save!
    end

    set_parent_ids(location, present_parent_level_ids)
  end

  # Identify missing Country or State location levels. Even for levels below State, clustering is
  # only at Country+State for now.
  def self.present_and_missing_parents(location)
    # Find if the Country or State level is missing
    country_match = Location.where(
      geo_level: COUNTRY_LEVEL,
      country_name: location.country_name
    )
    state_match = Location.where(
      geo_level: STATE_LEVEL,
      country_name: location.country_name,
      state_name: location.state_name
    )
    present_parents = country_match.or(state_match)
    present_parent_levels = present_parents.pluck(:geo_level)

    missing_parent_levels = []
    [COUNTRY_LEVEL, STATE_LEVEL].each do |level|
      if !present_parent_levels.include?(level) && location["#{level}_name"].present? && location.geo_level != level
        missing_parent_levels << level
      end
    end

    present_parent_level_ids = present_parents.map { |p| [p.geo_level, p.id] }.to_h
    [present_parent_level_ids, missing_parent_levels]
  end

  def self.set_parent_ids(location, parent_level_ids)
    parent_level_ids.each do |level, id|
      if Location::GEO_LEVELS.index(level) <= Location::GEO_LEVELS.index(location.geo_level)
        location["#{level}_id"] = id
      end
    end
    location
  end
end
