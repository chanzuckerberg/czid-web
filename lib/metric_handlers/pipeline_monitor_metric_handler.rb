require_relative 'base'
require './lib/cloudwatch_util'

module MetricHandlers
  class PipelineMonitorMetricHandler < Base
    def process_event
      logger_iteration_data = @event.payload[:logger_iteration_data]
      event_log = {
        type: "metric",
        source: "backend",
        msg: "run.pipeline_monitor",
        v: 0,
        details: {
          args: @event.payload[:args],
          message: logger_iteration_data[:message],
          duration: logger_iteration_data[:duration],
          pr_id_count: logger_iteration_data[:pr_id_count],
          pt_id_count: logger_iteration_data[:pt_id_count],
          cg_id_count: logger_iteration_data[:cg_id_count],
          num_shards: logger_iteration_data[:num_shards],
        },
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
      logger_iteration_data = @event.payload[:logger_iteration_data]
      metric_data = []
      common_dimensions = [{ name: "Monitor Type", value: "Pipeline Monitor" }]

      metric_data << CloudWatchUtil.create_metric_datum("Duration", logger_iteration_data[:duration], "Seconds", common_dimensions)
      metric_data << CloudWatchUtil.create_metric_datum("Pipeline Run Count", logger_iteration_data[:pr_id_count], "Count", common_dimensions)
      metric_data << CloudWatchUtil.create_metric_datum("Phylo Tree Run Count", logger_iteration_data[:pt_id_count], "Count", common_dimensions)
      metric_data << CloudWatchUtil.create_metric_datum("Consensus Genome Run Count", logger_iteration_data[:cg_id_count], "Count", common_dimensions)
      metric_data << CloudWatchUtil.create_metric_datum("Number of Shards", logger_iteration_data[:num_shards], "Count", common_dimensions)

      CloudWatchUtil.put_metric_data("#{Rails.env}-pipeline-monitor", metric_data)
    end
  end
end
