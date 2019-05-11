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

  def self.find_or_create_by_fields(location_data)
    key_fields = [:name, :geo_level, :country_name, :state_name, :subdivision_name, :city_name, :lat, :lng]
    # Consider the location to already exist if it matches all these fields
    existing = Location.find_by(key_fields.map { |f| [f, location_data[f]] }.to_h)

    unless existing
      existing = Location.create(location_data)
    end
    existing
  end
end
