module InstrumentedJob
  @extra_dimensions = {}

  # Use extra_dimensions when wanting to add extra dimensions to CloudWatch metric
  # Hash<key: String, value: String> where the key matches a parameter exactly from the parent's self.perform method and value is the name of the extra dimension.
  # i.e. Given parent method definition: def self.perform(param1, param2) end
  # extra_dimensions param1: "Example Dimension 1", param2: "Example Dimension 2"
  def extra_dimensions(hash)
    raise ArgumentError, "Argument is not a Hash" unless hash.is_a? Hash
    @extra_dimensions = hash
  end

  def before_perform_start_instrumentation(*_args)
    ActiveSupport::Notifications.instrumenter.start("resque.#{name.underscore}", job_name: name.camelize)
    raise "extra_dimensions keys do not match method parameters" if !@extra_dimensions.nil? && (@extra_dimensions.keys - method(:perform).parameters.map(&:last)).any?
  end

  def after_perform_finish_instrumentation(*args)
    params_hash = Hash[method(:perform).parameters.map(&:last).zip(args)]
    ActiveSupport::Notifications.instrumenter.finish("resque.#{name.underscore}", job_name: name.camelize, extra_dimensions: @extra_dimensions, params: params_hash, status: "Success")
  end

  def on_failure(*args)
    params = method(:perform).parameters.map(&:last).map(&:to_s).unshift("error")
    params_hash = Hash[params.zip(args)]
    ActiveSupport::Notifications.instrumenter.finish("resque.#{name.underscore}", job_name: name.camelize, params: params_hash, status: "Failure")
  end
end
