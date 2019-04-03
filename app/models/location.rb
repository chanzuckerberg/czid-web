class Location < ApplicationRecord
  # Search request to Location IQ API
  def self.geosearch(query)
    raise ArgumentError, "No query for geosearch" if query.blank?
    raise "No API key for geosearch" unless ENV['LOCATION_IQ_API_KEY']

    base_url = "https://us1.locationiq.com/v1/search.php?key=#{ENV['LOCATION_IQ_API_KEY']}&format=json&addressdetails=1&normalizecity=1"
    query_url = "#{base_url}&q=#{query}"
    uri = URI.parse(query_url)
    request = Net::HTTP::Get.new(uri)
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end
  end
end
