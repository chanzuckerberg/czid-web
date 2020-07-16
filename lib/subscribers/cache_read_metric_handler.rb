require_relative 'base'

module Subscribers
  class CacheReadMetricHandler < Base
    def process_event
      event_log = {
        type: "metric",
        source: "backend",
        msg: "cached_read.active_support",
        v: 1,
        details: {
          name: event.name,
          key: event.payload[:key],
          hit: event.payload[:hit],
          super_operation: event.payload[:super_operation],
          event_duration: event.duration,
        },
      }

      # event.payload[:exception] => ["exception name", "exception message"]
      if event.payload[:exception].present?
        event_log[:details][:exception] = {
          name: event.payload[:exception][0],
          message: event.payload[:exception][1],
        }
      end

      logger.info(event_log)
    end
  end
end
