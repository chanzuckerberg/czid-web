module MetricHandlers
  class Base
    attr_reader :event, :logger

    def call(name, started, finished, unique_id, payload)
      @event = ActiveSupport::Notifications::Event.new(name, started, finished, unique_id, payload)
      @logger = Ougai::Logger.new(STDOUT)
      @logger.formatter = Ougai::Formatters::Readable.new if Rails.env.development?
      process_event
    end

    def process_event
      raise NotImplementedError
    end
  end
end
