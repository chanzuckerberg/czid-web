module Subscribers
  class ActionControllerMetricHandler < Base
    def process
      event_log = {
        type: "metric",
        source: "backend",
        msg: "process_action.action_controller",
        v: 1,
        details: {
          controller: event.payload[:controller],
          action: event.payload[:action],
          params: event.payload[:params],
          path: event.payload[:path],
          request: event.payload[:request],
          status: event.payload[:status],
          location: event.payload[:location],
          db_runtime: event.payload[:db_runtime],
          event_duration: event.duration, # in milliseconds
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
