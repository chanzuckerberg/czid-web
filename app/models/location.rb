class Location < ApplicationRecord
  # Search request to Location IQ API
  def self.geosearch(query)
    raise ArgumentError, "No query for geosearch" if query.blank?
    raise "No API key for geosearch" unless ENV['LOCATION_IQ_API_KEY']

    base_url = "https://us1.locationiq.com/v1/search.php?key=#{ENV['LOCATION_IQ_API_KEY']}&format=json&addressdetails=1&normalizecity=1"
    query_url = "#{base_url}&q=#{query}"
    uri = URI.parse(query_url)
    request = Net::HTTP::Get.new(uri)
    resp = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end
    [resp.is_a?(Net::HTTPSuccess), JSON.parse(resp.body)]
  end

  def self.find_by_params(location_params)
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

  def self.find_or_create_by_fields(location_params)
    unless find_by(params: location_params)
      return create_from_params(location_params)
    end
  end
end
