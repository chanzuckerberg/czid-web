require "uri"
require "net/http"

# MetricUtil is currently used for:
#  * tracking user initiated actions with Segment
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

  # This should never block on error.

  # Anything less than 500 r/s should be fine. See
  # https://segment.com/docs/sources/server/http/#rate-limits. In addition,
  # segment says the server lib batches automatically. See
  # https://segment.com/docs/sources/server/http/#batch.

  # Use for usage metrics. Sends to GoogleAnalytics.
  # See EventDictionary.
  def self.log_analytics_event(event, user, properties = {}, request = nil)
    if SEGMENT_ANALYTICS && !a_test?(request)
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
        properties: properties.merge(
          # For Google Analytics. See
          # https://segment.com/docs/destinations/google-analytics/#track
          label: properties.to_json,
          category: event.split("_")[0],
          git_version: ENV['GIT_VERSION']
        ),
        context: request ? context_for_segment(request) : {}
      )
    end
  rescue StandardError => err
    LogUtil.log_error(
      "Failed to log to Segment '#{event}': #{err}",
      exception: err,
      event: event,
      user_id: user_id
    )
  end

  def self.post_to_airtable(table_name, data)
    # Reference: https://airtable.com/api
    if ENV["AIRTABLE_BASE_ID"] && ENV["AIRTABLE_API_KEY"]
      endpoint = "https://api.airtable.com/v0"
      uri = URI.parse("#{endpoint}/#{ENV['AIRTABLE_BASE_ID']}/#{ERB::Util.url_encode(table_name)}?api_key=#{ENV['AIRTABLE_API_KEY']}")

      https_post(uri, data)
    else
      Rails.logger.warn("Cannot send to Airtable. Check AIRTABLE_BASE_ID and AIRTABLE_API_KEY.")
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
          url: request.original_url(),
        },
        userAgent: request.user_agent,
        ip: request.remote_ip(),
      }
    end

    def https_post(uri, data)
      # Don't block the rest of the flow
      Thread.new do
        Rails.logger.info("Sending data: #{data}")
        request = Net::HTTP::Post.new(uri)
        request.content_type = "application/json"
        request.body = data
        req_options = {
          use_ssl: uri.scheme == "https",
        }

        response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
          http.request(request)
        end
        unless response.is_a?(Net::HTTPSuccess)
          Rails.logger.warn("Unable to send data: #{response.message}")
        end
      end
    end

    def a_test?(request = nil)
      Rails.env.test? ||
        (!request.nil? && request.user_agent == "Rails Testing")
    end
  end
end
