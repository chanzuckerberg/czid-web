require "net/http"

module HttpHelper
  def self.post_json(url, body)
    uri = URI.parse(url)
    request = Net::HTTP::Post.new(uri)
    request.content_type = "application/json"
    request.body = JSON.dump(body)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("POST request to #{url} failed: #{response.message}")
      return nil
    end

    begin
      # Parse the body as JSON and return it.
      JSON.parse(response.body)
    rescue JSON::ParserError
      Rails.logger.warn("POST response from #{url} was not valid JSON")
      return nil
    end
  end

  def self.get_json(url, params, headers)
    uri = URI.parse(url)
    request = Net::HTTP::Get.new(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"

    # Add headers
    headers.each do |key, value|
      request[key] = value
    end

    # Add params to url
    uri.query = URI.encode_www_form(params)

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("GET request to #{url} failed: #{response.message}")
      return nil
    end

    begin
      # Parse the body as JSON and return it.
      JSON.parse(response.body)
    rescue JSON::ParserError
      Rails.logger.warn("GET response from #{url} was not valid JSON")
      return nil
    end
  end
end
