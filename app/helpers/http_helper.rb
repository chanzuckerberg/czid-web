require "http"

module HttpHelper
  class HttpError < StandardError
    attr_reader :status_code

    def initialize(msg, status_code)
      @status_code = status_code
      super(msg)
    end
  end

  def self.post_json(url, body)
    response = HTTP.post(url, json: body)

    unless response.status.success?
      Rails.logger.warn("POST request to #{url} failed: #{response.body}")
      raise HttpError.new("HTTP POST request failed", response.code)
    end

    begin
      # Parse the body as JSON and return it.
      JSON.parse(response.body)
    rescue JSON::ParserError => e
      Rails.logger.warn("POST response from #{url} was not valid JSON")
      raise e
    end
  end

  def self.get_json(url, params, headers, silence_errors = false)
    http = HTTP.headers(headers)

    response = http.get(url, params: params)

    unless response.status.success?
      unless silence_errors
        Rails.logger.warn("GET request to #{url} failed: #{response.body}")
      end
      raise HttpError.new("HTTP GET request failed", response.code)
    end

    begin
      # Parse the body as JSON and return it.
      JSON.parse(response.body)
    rescue JSON::ParserError => e
      Rails.logger.warn("GET response from #{url} was not valid JSON")
      raise e
    end
  end

  # Delete requests typically don't contain a request body.
  def self.delete(url, headers)
    http = HTTP.headers(headers)

    response = http.delete(url)

    unless response.status.success?
      Rails.logger.warn("DELETE request to #{url} failed: #{response.body}")
      raise HttpError.new("HTTP DELETE request failed", response.code)
    end

    return nil
  end
end
