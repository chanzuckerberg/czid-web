module Subscribers
  class Base
    attr_reader :event, :logger

    def call(name, started, finished, unique_id, payload)
      @event = ActiveSupport::Notifications::Event.new(name, started, finished, unique_id, payload)
      @logger = Ougai::Logger.new(STDOUT)
      process
    end

    def process
      raise NotImplementedError
    end
  end
end
