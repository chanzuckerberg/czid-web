require_relative 'base'
require './lib/cloudwatch_util'

METRIC_VERSION = 0
module MetricHandlers
  class ActionControllerMetricHandler < Base
    def process_event
      event_log = {
        type: "metric",
        source: "backend",
        msg: "process_action.action_controller",
        v: METRIC_VERSION,
        details: {
          controller: @event.payload[:controller],
          action: @event.payload[:action],
          method: @event.payload[:method],
          params: @event.payload[:params],
          path: @event.payload[:path],
          # Without .to_s this causes SystemStackError when request is present:
          request: @event.payload[:request].to_s,
          status: @event.payload[:status],
          location: @event.payload[:location],
          db_runtime: @event.payload[:db_runtime],
          event_duration: @event.duration, # in milliseconds
        },
      }

      # Format of event.payload[:exception]: ["exception name", "exception message"]
      if @event.payload[:exception].present?
        event_log[:details][:exception] = {
          name: @event.payload[:exception][0],
          message: @event.payload[:exception][1],
        }
        process_exception_metric
      else
        process_metric
      end
    ensure
      @logger.info(event_log)
    end

    def process_metric
      metric_data = []
      common_dimensions = [
        { name: "Controller", value: @event.payload[:controller] },
        { name: "Action", value: @event.payload[:params]["action"] },
      ]

      if @event.payload[:status].present?
        metric_data << CloudWatchUtil.create_metric_datum("Request Status", 1.0, "Count",
                                                          [
                                                            { name: "Controller", value: @event.payload[:controller] },
                                                            { name: "Action", value: @event.payload[:params]["action"] },
                                                            { name: "Status", value: @event.payload[:status].to_s },
                                                          ])
      end
      metric_data << CloudWatchUtil.create_metric_datum("Duration", @event.duration, "Milliseconds", common_dimensions.dup) if @event.duration.present?
      metric_data << CloudWatchUtil.create_metric_datum("DB Runtime", @event.payload[:db_runtime], "Milliseconds", common_dimensions.dup) if @event.payload[:db_runtime].present?

      # Send a metric with & without extra dimensions for querying purposes
      CloudWatchUtil.put_metric_data("#{Rails.env}-web-action_controller-#{METRIC_VERSION}", metric_data)

      extra_dimensions = {
        "Format" => @event.payload[:params]["format"].nil? ? "None" : @event.payload[:params]["format"],
        "Method" => @event.payload[:method],
      }
      extra_dimensions["Domain"] = @event.payload[:params]["domain"] if @event.payload[:params]["domain"].present?

      extra_dimensions.each do |dim, val|
        metric_data.map do |metric|
          metric[:dimensions] << { name: dim, value: val }
        end
      end

      CloudWatchUtil.put_metric_data("#{Rails.env}-web-action_controller-extra-dimensions-#{METRIC_VERSION}", metric_data)
    end

    def process_exception_metric
      metric_data = []
      common_dimensions = [
        { name: "Controller", value: @event.payload[:controller] },
        { name: "Action", value: @event.payload[:params]["action"] },
        { name: "Exception", value: @event.payload[:exception][0] },
      ]

      metric_data << CloudWatchUtil.create_metric_datum("Occurrences", 1.0, "Count", common_dimensions.dup)
      metric_data << CloudWatchUtil.create_metric_datum("Duration", @event.duration, "Milliseconds", common_dimensions.dup)

      metric_data.map do |metric|
        metric[:dimensions] << { name: "Domain", value: @event.payload[:params]["domain"] } if @event.payload[:params]["domain"].present?
        metric[:dimensions] << { name: "Status", value: @event.payload[:params]["status"].to_s } if @event.payload[:params]["status"].present?
      end

      CloudWatchUtil.put_metric_data("#{Rails.env}-web-action_controller-exceptions-#{METRIC_VERSION}", metric_data)
    end
  end
end
