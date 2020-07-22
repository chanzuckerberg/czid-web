require_relative 'base'
require './lib/cloudwatch_util'

module MetricHandlers
  class ResqueJobMetricHandler < Base
    def process_event
      event_log = {
        type: "metric",
        source: "resque",
        msg: @event.name,
        v: 1,
        details: {
          name: @event.payload[:job_name],
          status: @event.payload[:status],
          duration: @event.duration,
          params: @event.payload[:params],
        },
      }

      # Format of event.payload[:exception]: ["exception name", "exception message"]
      if @event.payload[:exception].present?
        event_log[:details][:exception] = {
          name: @event.payload[:exception][0],
          message: @event.payload[:exception][1],
        }
      end

      if @event.payload[:extra_dimensions].present?
        event_log[:details][:extra_dimensions] = @event.payload[:extra_dimensions]
      end

      @logger.info(event_log)
      process_metric
    end

    def process_metric
      metric_data = []
      dimensions = [
        { name: "Job name", value: @event.payload[:job_name] },
        { name: "Status", value: @event.payload[:status] },
      ]

      # Given an extra_dimension hash {:param1 => "Dimension Name 1", :param2 => "Dimension Name 2", ... :paramN => "Dimension Name N"}
      # And params hash {:param1 => value1, :param2 => value2, ..., :paramN => valueN}
      # This reduce function appends a new hash to dimensions (that is a mapping betweem extra_dimensions and params) i.e.
      #   dimensions << { name: "Dimension Name 1", value: value1 }
      #   dimensions << { name: "Dimension Name 2", value: value2 }
      #   dimensions << { name: "Dimension Name N", value: valueN }
      event.payload[:extra_dimensions].reduce(dimensions) { |dims, (key, value)| dims << { name: value, value: @event.payload[:params][key] } } if event.payload[:extra_dimensions].present?

      metric_data << CloudWatchUtil.create_metric_datum("Duration", @event.duration, "Milliseconds", dimensions)
      metric_data << CloudWatchUtil.create_metric_datum("Status Occurences", 1.0, "Count", dimensions)
      CloudWatchUtil.put_metric_data("#{Rails.env}-resque-jobs", metric_data)
    end
  end
end
