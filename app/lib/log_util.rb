require "uri"
require "net/http"

class LogUtil
  def self.log_err_and_airbrake(msg)
    Rails.logger.error(msg)
    Airbrake.notify(msg)
  end

  def self.log_backtrace(exception)
    Rails.logger.error("Backtrace:\n\t#{exception.backtrace.join("\n\t")}")
  end

  def self.put_metric_now(name, value)
    put_metric(name, value, Time.now.to_i)
  end

  def self.put_metric(name, value, time)
    # Time = POSIX time with just seconds
    points = [[time, value]]
    put_metric_point_series(name, points)
  end

  def self.put_metric_point_series(name, points)
    data = JSON.dump("series" => [{
                       "metric" => name,
                       "points" => points
                     }])
    post_to_datadog(data)
  end

  def self.post_to_datadog(data)
    if ENV["datadog_api_key"]
      endpoint = "https://api.datadoghq.com/api/v1/series"
      api_key = ENV["datadog_api_key"]
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
      Rails.logger.warn("Unable to send data")
    end
  end
end
