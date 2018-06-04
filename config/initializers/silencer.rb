require 'silencer/logger'

Rails.application.configure do
  config.middleware.swap Rails::Rack::Logger, Silencer::Logger, silence: ["/health_check"]
end
