require_relative 'base'
require './lib/cloudwatch_util'
require './app/lib/array_util'

module MetricHandlers
  class SnippetMetricHandler < Base
    def process_event
      event_log = {
        type: "metric",
        source: "backend",
        msg: @event.name,
        v: 1,
        details: @event.payload,
      }

      # Format of event.payload[:exception]: ["exception name", "exception message"]
      if @event.payload[:exception].present?
        event_log[:details][:exception] = {
          name: @event.payload[:exception][0],
          message: @event.payload[:exception][1],
        }
      else
        process_metric
      end
    ensure
      @logger.info(event_log)
    end

    def process_metric
      has_extra_metrics = @event.payload[:extra_metrics] && @event.payload[:extra_metrics].any?
      raise "No metrics will be processed because default metrics were disabled and no extra_metrics were included in payload" if @event.payload[:disable_default_metrics] && !has_extra_metrics

      dimensions = @event.payload[:snippet].present? ? [{ name: "Snippet", value: @event.payload[:snippet] }] : []
      dimensions = ArrayUtil.merge_arrays_uniq(dimensions, @event.payload[:extra_dimensions]) if @event.payload[:extra_dimensions].present?

      metric_data = @event.payload[:disable_default_metrics] ? [] : [CloudWatchUtil.create_metric_datum("Duration", @event.duration, "Milliseconds", dimensions)]
      if @event.payload[:extra_metrics].present?
        metric_data = ArrayUtil.merge_arrays_uniq(metric_data, @event.payload[:extra_metrics])
        metric_data.map { |metric| metric[:dimensions] = dimensions }
      end

      namespace = @event.payload[:cloudwatch_namespace].presence || "#{Rails.env}-snippets"
      CloudWatchUtil.put_metric_data(namespace, metric_data)
    rescue StandardError => err
      Rails.logger.error(err.message)
    end
  end
end
