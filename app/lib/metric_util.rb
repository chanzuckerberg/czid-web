require "uri"
require "net/http"

# MetricUtil is currently used for posting metrics to Datadog's metrics endpoints.
class MetricUtil
  def self.put_metric_now(name, value, tags = [])
    put_metric(name, value, Time.now.to_i, tags)
  end

  def self.put_metric(name, value, time, tags = [])
    # Time = POSIX time with just seconds
    points = [[time, value]]
    put_metric_point_series(name, points, tags)
  end

  def self.put_metric_point_series(name, points, tags = [])
    # Tags look like: ["environment:test", "type:bulk"]
    name = "idseq.web.#{Rails.env}.#{name}"
    data = JSON.dump("series" => [{
                       "metric" => name,
                       "points" => points,
                       "tags" => tags
                     }])
    post_to_datadog(data)
  end

  def self.post_to_datadog(data)
    if ENV["DATADOG_API_KEY"]
      endpoint = "https://api.datadoghq.com/api/v1/series"
      api_key = ENV["DATADOG_API_KEY"]
      uri = URI.parse("#{endpoint}?api_key=#{api_key}")
      https_post(uri, data)
    else
      Rails.logger.warn("Cannot send metrics data. No Datadog API key set.")
    end
  end

  def self.https_post(uri, data)
    Rails.logger.info("Sending data: #{data}")
    request = Net::HTTP::Post.new(uri)
    request.content_type = "application/json"
    request.body = data
    req_options = {
      use_ssl: uri.scheme == "https"
    }
    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(request)
    end

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("Unable to send data: #{response.message}")
    end
  end
end
