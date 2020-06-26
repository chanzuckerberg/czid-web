module Subscribers
  class CacheWriteMetricHandler < Base
    def process
      event_log = {
        type: "metric",
        source: "backend",
        msg: "cached_write.active_support",
        v: 1,
        details: {
          name: event.name,
          key: event.payload[:key],
          event_duration: event.duration,
        },
      }

      # event.payload[:exception] => array of two elements as value: a string with the name of the exception class, and the exception message.
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
