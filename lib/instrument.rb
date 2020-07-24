# This wrapper for ActiveSupport::Notifications.instrument was created with the intention
# of making instrumentation of snippets easier, more readable, and more customizable.
# A snippet refers to a block of code.
module Instrument
  # Instrument.snippet instruments a snippet of code (code block)
  # Snippet(name: ) should be a short descriptive name that describes the snippet about to be instrumented.
  def self.snippet(name:, cloudwatch_namespace: "", extra_dimensions: [], payload: {})
    raise ArgumentError, "Argument <name> is not a String" unless name.is_a? String

    event_name = name.dup.concat(".snippet")
    listeners_state = ActiveSupport::Notifications.instrumenter.start(event_name, payload)
    begin
      yield payload if block_given?
    rescue StandardError => e
      payload[:exception] = [e.class.name, e.message]
      payload[:exception_object] = e
      raise e
    ensure
      payload[:snippet] = name
      payload[:cloudwatch_namespace] = cloudwatch_namespace unless cloudwatch_namespace.empty?
      payload[:extra_dimensions] = extra_dimensions unless extra_dimensions.empty?
      ActiveSupport::Notifications.instrumenter.finish_with_state(listeners_state, event_name, payload)
    end
  end
end
