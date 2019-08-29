require "net/http"

module HttpHelper
  def self.post_json(url, body)
    uri = URI.parse(url)

    request = Net::HTTP::Post.new(uri.request_uri)
    request.content_type = "application/json"
    request.body = JSON.dump(body)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("POST request to #{url} failed: #{response.message}")
      raise "HTTP POST request failed"
    end

    begin
      # Parse the body as JSON and return it.
      JSON.parse(response.body)
    rescue JSON::ParserError
      Rails.logger.warn("POST response from #{url} was not valid JSON")
      raise
    end
  end

  def self.get_json(url, params, headers, silence_errors = false)
    uri = URI.parse(url)
    # Add params to url
    uri.query = params.to_query

    request = Net::HTTP::Get.new(uri.request_uri)
    # Add headers
    headers.each do |key, value|
      request[key] = value
    end

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      unless silence_errors
        Rails.logger.warn("GET request to #{url} failed: #{response.message}")
      end
      raise "HTTP GET request failed"
    end

    begin
      # Parse the body as JSON and return it.
      JSON.parse(response.body)
    rescue JSON::ParserError
      Rails.logger.warn("GET response from #{url} was not valid JSON")
      raise
    end
  end

  # Delete requests typically don't contain a request body.
  def self.delete(url, headers)
    uri = URI.parse(url)

    request = Net::HTTP::Delete.new(uri.request_uri)
    # Add headers
    headers.each do |key, value|
      request[key] = value
    end

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("DELETE request to #{url} failed: #{response.message}")
      raise "HTTP DELETE request failed"
    end

    return nil
  end
end
