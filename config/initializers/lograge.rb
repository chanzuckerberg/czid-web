# Recommended by Datadog: https://docs.datadoghq.com/logs/log_collection/ruby/

Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Raw.new
  config.lograge.custom_options = lambda do |event|
    { ddsource: ["ruby"],
      params: event.payload[:params].reject { |k| %w[controller action].include? k } }
  end
  config.colorize_logging = false
end
