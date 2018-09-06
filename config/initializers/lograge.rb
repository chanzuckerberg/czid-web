# Recommended by Datadog: https://docs.datadoghq.com/logs/log_collection/ruby/

Rails.application.configure do
  if false
    # Present in deployed environments but leaves things more verbose for
    # local development.
    config.log_level = :info
    config.lograge.enabled = true
    config.lograge.formatter = Lograge::Formatters::Json.new
    config.lograge.logger = ActiveSupport::Logger.new(STDOUT)
    config.lograge.custom_options = lambda do |event|
      { time: event.time,
        ddsource: ["ruby"],
        params: event.payload[:params].reject { |k| %w[controller action].include? k } }
    end
    config.colorize_logging = false
    config.lograge.ignore_actions = ["HealthCheck::HealthCheckController#index"]
  end
end
