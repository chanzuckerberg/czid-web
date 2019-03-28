require "uri"
require "net/http"

# MetricUtil is currently used for:
#  * tracking user initiated actions with Segment
#  * posting metrics to Datadog's metrics endpoints (DEPRECATED)
# See https://czi.quip.com/bKDnAITc6CbE/How-to-start-instrumenting-analytics-2019-03-06
class MetricUtil
  SEGMENT_ANALYTICS = if ENV["SEGMENT_RUBY_ID"]
                        Segment::Analytics.new(
                          write_key: ENV["SEGMENT_RUBY_ID"],
                          on_error: proc do |status, msg|
                            Rails.logger.error("Segment error: #{status}: #{msg}")
                          end
                        )
                      end

  # Backend event name guidelines:
  # Follow object_action convention with object being the name of the core model or component name
  # if it makes sense, and a past tense action. Keep names meaningful, descriptive, and
  # non-redundant (e.g. prefer sample_viewed to sample_view_viewed).
  # TODO: (gdingle): coordinate with ANALYTICS_EVENT_NAMES in client JS
  ANALYTICS_EVENT_NAMES = {
    user_created: "user_created",
    project_created: "project_created",
    pipeline_run_succeeded: "pipeline_run_succeeded",
    pipeline_run_failed: "pipeline_run_failed",
    sample_upload_batch_created: "sample_upload_batch_created"
  }.freeze

  # DEPRECATED. Use log_analytics_event.
  def self.put_metric_now(name, value, tags = [], type = "count")
    put_metric(name, value, Time.now.to_i, tags, type)
  end

  # This should never block on error.
  def self.log_analytics_event(event, user, properties = {}, request = nil)
    if SEGMENT_ANALYTICS
      # current_user should be passed from a controller
      user_id = user ? user.id : 0

      if user
        SEGMENT_ANALYTICS.identify(
          user_id: user_id,
          traits: user.traits_for_segment,
          context: request ? context_for_segment(request) : {}
        )
      end

      SEGMENT_ANALYTICS.track(
        event: event,
        user_id: user_id,
        properties: properties,
        context: request ? context_for_segment(request) : {}
      )
    end
  rescue => err
    LogUtil.log_err_and_airbrake("Failed to log to Segment '#{event}': #{err}")
  end

  # Log analytics from a batch of new samples from an upload session
  def self.log_upload_batch_analytics(samples, user, client, request = nil)
    # Send off an event for each project and host genome combo
    samples.group_by { |s| [s.project_id, s.host_genome_id] }.each do |(project_id, host_genome_id), entries|
      log_analytics_event(
        ANALYTICS_EVENT_NAMES[:sample_upload_batch_created],
        user,
        { count: entries.count, project_id: project_id, host_genome_id: host_genome_id, client: client },
        request
      )
    end
  end

  # Start private class methods
  class << self
    private

    # See https://segment.com/docs/spec/common/#context
    # See https://api.rubyonrails.org/classes/ActionDispatch/Request.html
    def context_for_segment(request)
      {
        page: {
          path: request.fullpath().split("?")[0],

          referrer: request.referer,
          search: request.fullpath().split("?")[1],
          url: request.original_url()
        },
        userAgent: request.user_agent,
        ip: request.remote_ip()
      }
    end

    def put_metric(name, value, time, tags = [], type = "count")
      # Time = POSIX time with just seconds
      points = [[time, value]]
      put_metric_point_series(name, points, tags, type)
    end

    def put_metric_point_series(name, points, tags = [], type = "count")
      # Tags look like: ["environment:test", "type:bulk"]
      name = "idseq.web.#{Rails.env}.#{name}"
      data = JSON.dump("series" => [{
                         "metric" => name,
                         "points" => points,
                         "type" => type,
                         "tags" => tags
                       }])
      post_to_datadog(data)
    end

    def post_to_datadog(data)
      if ENV["DATADOG_API_KEY"]
        endpoint = "https://api.datadoghq.com/api/v1/series"
        api_key = ENV["DATADOG_API_KEY"]
        uri = URI.parse("#{endpoint}?api_key=#{api_key}")
        https_post(uri, data)
      else
        Rails.logger.warn("Cannot send metrics data. No Datadog API key set.")
      end
    end

    def https_post(uri, data)
      # Don't block the rest of the flow
      Thread.new do
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
  end
end
