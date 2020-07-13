module Subscribers
  class ActionControllerMetricHandler < Base
    def process_event
      event_log = {
        type: "metric",
        source: "backend",
        msg: "process_action.action_controller",
        v: 1,
        details: {
          controller: @event.payload[:controller],
          action: @event.payload[:action],
          params: @event.payload[:params],
          path: @event.payload[:path],
          request: @event.payload[:request],
          status: @event.payload[:status],
          location: @event.payload[:location],
          db_runtime: @event.payload[:db_runtime],
          event_duration: @event.duration, # in milliseconds
        },
      }

      # @event.payload[:exception] => ["exception name", "exception message"]
      if @event.payload[:exception].present?
        event_log[:details][:exception] = {
          name: @event.payload[:exception][0],
          message: @event.payload[:exception][1],
        }
        process_exception_metric
      else
        process_metric
      end

      @logger.info(event_log)
    end

    def process_metric
      domain = @event.payload[:params]["domain"]
      clean_path = "/#{@event.payload[:params]['controller']}/#{@event.payload[:params]['action']}"

      metric_data = [
        CloudWatchUtil.create_metric_datum("Duration", @event.duration, "Milliseconds",
                                           [
                                             { name: "Controller", value: @event.payload[:controller] },
                                             { name: "Path", value: clean_path },
                                           ]),

        CloudWatchUtil.create_metric_datum("DB Runtime", @event.payload[:db_runtime], "Milliseconds",
                                           [
                                             { name: "Controller", value: @event.payload[:controller] },
                                             { name: "Path", value: clean_path },
                                           ]),

        CloudWatchUtil.create_metric_datum("Request Status", 1.0, "Count",
                                           [
                                             { name: "Status", value: @event.payload[:status].to_s },
                                             { name: "Path", value: clean_path },
                                           ]),
      ]

      metric_data.map { |metric| metric[:dimensions].append(name: "Domain", value: domain) } if domain.present?
      CloudWatchUtil.put_metric_data("#{Rails.env}-web-action_controller-domain", metric_data)
    end

    def process_exception_metric
      domain = @event.payload[:params]["domain"]
      clean_path = "/#{@event.payload[:params]['controller']}/#{@event.payload[:params]['action']}"

      metric_data = [
        CloudWatchUtil.create_metric_datum("Exception Occurences", 1.0, "Count", [
                                             { name: "Path", value: clean_path }, { name: "Exception Name", value: @event.payload[:exception][0] },
                                             { name: "Exception Message", value: @event.payload[:exception][1] },
                                           ]),
      ]

      metric_data.map { |metric| metric[:dimensions].append(name: "Domain", value: domain) } if domain.present?
      CloudWatchUtil.put_metric_data("#{Rails.env}-web-action_controller-exceptions", metric_data)
    end
  end
end
