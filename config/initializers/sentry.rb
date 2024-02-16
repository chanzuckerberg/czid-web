# DSN stands for Data Source Name
if ENV['SENTRY_DSN_BACKEND']

  # Raven for Ruby is a client and integration layer for the Sentry error reporting API
  # To use Raven Ruby all you need is your DSN.
  #
  # Configuration details:
  # https://docs.sentry.io/platforms/ruby/config/#optional-settings

  Raven.configure do |config|
    config.dsn = ENV['SENTRY_DSN_BACKEND']

    # This supersedes current_environment_from_env
    # (https://github.com/getsentry/sentry-ruby/blob/master/sentry-raven/lib/raven/configuration.rb#L546)
    # to add a check for Rails.env in case RAILS_ENV is not set.
    config.current_environment = ENV['RAILS_ENV'] || Rails.env
    # We only want to send events to Sentry in staging and prod environments
    # To send events from development, add 'development' to config.environments
    config.environments = ['sandbox', 'staging', 'prod']
  end

  # Reporting Failures
  # If you use Rails, Rake, Rack etc, you're already done - no more configuration required!
  # All uncaught exceptions will be automatically reported.

  # Reporting Messages
  # Use LogUtil.log_err
  # If you want to report a message rather than an exception you can use the capture_message method:
  # Raven.capture_message("Something went very wrong")
end
