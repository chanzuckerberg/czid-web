Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.cache_classes = true

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true
  config.cache_store = :redis_store, ENV['REDISCLOUD_URL'] + '/0/cache',
                       {
                         # Needed for redis to evict keys in volatile-lru mode
                         expires_in: 30.days,
                       }

  # Attempt to read encrypted secrets from `config/secrets.yml.enc`.
  # Requires an encryption key in `ENV["RAILS_MASTER_KEY"]` or
  # `config/secrets.yml.key`.
  config.read_encrypted_secrets = true

  # Disable serving static files from the `/public` folder by default since
  # Apache or NGINX already handles this.
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?

  # Don't add an asset compressor here because we already minimize with webpack.
  # Check out webpack.config.prod.js.
  config.assets.debug = true
  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Do not fallback to assets pipeline if a precompiled asset is missed.
  # config.assets.compile = true

  # `config.assets.precompile` and `config.assets.version` have moved to config/initializers/assets.rb

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = 'X-Sendfile' # for Apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for NGINX

  # Mount Action Cable outside main process or domain
  # config.action_cable.mount_path = nil
  # config.action_cable.url = 'wss://example.com/cable'
  # config.action_cable.allowed_request_origins = [ 'http://example.com', /http:\/\/example.*/ ]

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true
  config.ssl_options = { redirect: { exclude: ->(request) { request.path =~ /health_check/ } } }

  # Use the lowest log level to ensure availability of diagnostic information
  # when problems arise.
  config.log_level = :info

  # Prepend all log lines with the following tags.
  config.log_tags = [:request_id]

  config.serve_static_assets = true

  # Use a different cache store in production.
  # config.cache_store = :mem_cache_store

  # Use a real queuing backend for Active Job (and separate queues per environment)
  # config.active_job.queue_adapter     = :resque
  # config.active_job.queue_name_prefix = "idseq-#{Rails.env}"

  config.action_mailer.default_url_options = { host: 'idseq.net' }

  # We configure IDseq to use cloudfront CDN when available.
  config.action_controller.asset_host = ENV['CLOUDFRONT_ENDPOINT'] || 'idseq.net'
  # Custom config for idseq to enable CORS headers by environment. See rack_cors.rb.
  config.allowed_cors_origins = [
    "https://idseq.net",
    "https://www.idseq.net",
    "https://assets.idseq.net",
    "https://prod.idseq.net",
    "https://assets.prod.idseq.net",
  ]

  config.middleware.use Rack::HostRedirect, 'www.idseq.net' => 'idseq.net'

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners.
  config.active_support.deprecation = :notify

  # Deployed logging configuration
  config.log_level = :info
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.logger = ActiveSupport::Logger.new(STDOUT)
  param_filtered = %w[controller action]
  config.lograge.custom_options = lambda do |event|
    { time: event.time,
      ddsource: ["ruby"],
      remote_ip: event.payload[:remote_ip],
      user_id: event.payload[:user_id],
      params: event.payload[:params].reject { |k| param_filtered.include? k }, }
  end
  config.colorize_logging = false
  config.lograge.ignore_actions = ["HealthCheck::HealthCheckController#index"]
  ActiveRecord::Base.logger.level = 1 if ActiveRecord::Base.logger

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Set the logging destination(s)
  config.log_to = %w[stdout]

  config.middleware.use ResqueMiddleware
end

# Deployed logging configuration
Logging::Rails.configure do |config|
  Logging.init %w[debug info warn error fatal]
  Logging.format_as :json
  layout = Logging.layouts.json

  # Configure an appender that will write log events to STDOUT.
  if config.log_to.include? 'stdout'
    Logging.appenders.stdout('stdout',
                             auto_flushing: true,
                             layout: layout)
  end

  # Configure an appender that will write log events to a file. The file will
  # be rolled on a daily basis, and the past 7 rolled files will be kept.
  # Older files will be deleted. The default pattern layout is used when
  # formatting log events into strings.
  if config.log_to.include? 'file'
    Logging.appenders.rolling_file('file',
                                   filename: config.paths['log'].first,
                                   keep: 7,
                                   age: 'daily',
                                   truncate: false,
                                   auto_flushing: true,
                                   layout: layout)
  end

  Logging.logger.root.level = :info
  Logging.logger.root.appenders = config.log_to unless config.log_to.empty?
end
