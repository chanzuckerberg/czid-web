require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :prod.
Bundler.require(*Rails.groups)

module Czid
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.1
    config.time_zone = 'Pacific Time (US & Canada)'
    config.active_record.default_timezone = :local
    config.middleware.use Rack::Deflater
    config.encoding = "utf-8"

    # ActionMailer settings
    config.action_mailer.raise_delivery_errors = true
    config.action_mailer.perform_caching = false
    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      address: "email-smtp.us-west-2.amazonaws.com",
      authentication: :login,
      domain: "idseq.net",
      enable_starttls_auto: true,
      password: ENV["SMTP_PASSWORD"],
      port: 587,
      user_name: ENV["SMTP_USER"],
    }

    # ResqueMiddleware to make it more secure:
    Dir["./app/middleware/*.rb"].sort.each do |file|
      require file
    end
    config.middleware.use ResqueMiddleware

    # This is an allowlist that protects against Host header spoofing. Only
    # idseq.net or subdomains are allowed. Test with a command such as:
    # curl -i -H $'Host: www.google.com' 'localhost:3000/auth0/login'
    config.hosts << '.idseq.net'
    config.hosts << '.czid.org'
    config.hosts << 'czid.org'
    # Exclude health_check so that load balancer checks are allowed:
    config.host_authorization = { exclude: ->(request) { request.path =~ /health_check/ } }
    config.x.constants.default_background = 26
  end
end

HealthCheck.setup do |config|
  # Exclude SMTP server test from standard check (can still use /health_check/email.json explicitly)
  config.standard_checks -= ["emailconf"]
end
