# DSN stands for Data Source Name
if ENV['SENTRY_DSN_BACKEND']

  # Raven for Ruby is a client and integration layer for the Sentry error reporting API
  # To use Raven Ruby all you need is your DSN.
  #
  # Configuration details:
  # https://docs.sentry.io/platforms/ruby/config/#optional-settings

  Raven.configure do |config|
    config.dsn = ENV['SENTRY_DSN_BACKEND']

    # Sentry automatically sets the current environment to RAILS_ENV.
    # We only want to send events to Sentry in staging and prod environments
    config.environments = ['staging', 'prod']
  end

  # Reporting Failures
  # If you use Rails, Rake, Rack etc, you're already done - no more configuration required!
  # All uncaught exceptions will be automatically reported.

  # Reporting Messages
  # Use LogUtil.log_err
  # If you want to report a message rather than an exception you can use the capture_message method:
  # Raven.capture_message("Something went very wrong")
end
