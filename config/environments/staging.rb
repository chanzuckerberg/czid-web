require "active_support/core_ext/integer/time"

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
  config.cache_store = :redis_cache_store,
                       {
                         url: ENV['REDISCLOUD_URL'] + '/0/cache',
                         # Needed for redis to evict keys in volatile-lru mode
                         expires_in: 30.days,
                       }
  config.session_store = :cookie_store, {
    key: '_czid_session',
  }
  # Ensures that a master key has been made available in either ENV["RAILS_MASTER_KEY"]
  # or in config/master.key. This key is used to decrypt credentials (and other encrypted files).
  # config.require_master_key = true

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

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = 'X-Sendfile' # for Apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for NGINX

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.service = :local

  # Mount Action Cable outside main process or domain
  # config.action_cable.mount_path = nil
  # config.action_cable.url = 'wss://example.com/cable'
  # config.action_cable.allowed_request_origins = [ 'http://example.com', /http:\/\/example.*/ ]

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true
  config.ssl_options = { redirect: { exclude: ->(request) { request.path =~ /health_check/ } } }

  # Include generic and useful information about system operation, but avoid logging too much
  # information to avoid inadvertent exposure of personally identifiable information (PII).
  config.log_level = :info

  # Prepend all log lines with the following tags.
  config.log_tags = [:request_id]

  # Use a different cache store in production.
  # config.cache_store = :mem_cache_store

  # Use a real queuing backend for Active Job (and separate queues per environment).
  # config.active_job.queue_adapter     = :resque
  # config.active_job.queue_name_prefix = "idseq-#{Rails.env}"

  config.action_mailer.default_url_options = { host: "#{Rails.env}.czid.org" }

  config.hosts << "staging.czid.org"
  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # We configure IDseq to use cloudfront CDN when available.
  config.asset_host = ENV['CZID_CLOUDFRONT_ENDPOINT'] || "#{Rails.env}.czid.org"
  # Custom config for idseq to enable CORS headers by environment. See rack_cors.rb.
  config.allowed_cors_origins = [
    "https://#{Rails.env}.idseq.net",
    "https://www.#{Rails.env}.idseq.net",
    "https://assets.#{Rails.env}.idseq.net",
    "https://#{Rails.env}.czid.org",
    "https://www.#{Rails.env}.czid.org",
    "https://assets.#{Rails.env}.czid.org",
  ]

  config.middleware.use Rack::HostRedirect, "www.#{Rails.env}.idseq.net" => "#{Rails.env}.idseq.net"
  config.middleware.use Rack::HostRedirect, "www.#{Rails.env}.czid.org" => "#{Rails.env}.czid.org"

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
  logger           = ActiveSupport::Logger.new(STDOUT)
  logger.formatter = config.log_formatter
  config.logger    = ActiveSupport::TaggedLogging.new(logger)
  config.log_to = %w[stdout]
end
