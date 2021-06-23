Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = true

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable/disable caching. By default caching is disabled.
  if Rails.root.join('tmp', 'caching-dev.txt').exist?
    config.action_controller.perform_caching = true
    config.cache_store = :redis_cache_store,
                         {
                           url: "#{ENV['REDISCLOUD_URL'] || 'redis://redis:6379'}/0/cache",
                           # Needed for redis to evict keys in volatile-lru mode
                           expires_in: 30.days,
                         }
    config.public_file_server.headers = {
      'Cache-Control' => "public, max-age=#{2.days.seconds.to_i}",
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  # config.force_ssl = true
  # config.ssl_options = { redirect: { exclude: ->(request) { request.path =~ /health_check/ } } }

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  # NOTE: webpack already pre-processes assets so we don't want to rails to.
  config.assets.debug = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  config.action_controller.asset_host = proc { |source|
    "http://localhost:8080" if source =~ /wp_bundle\.js$/i
  }
  # Uncomment this line to test cloudfront CDN. Must be running staging branch,
  # so that filename hashes match.
  # config.action_controller.asset_host = 'assets.staging.idseq.net'

  # Custom config for idseq to enable CORS headers by environment. See rack_cors.rb.
  config.allowed_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]

  ActiveRecordQueryTrace.enabled = true

  # Development logging configuration
  logger           = ActiveSupport::Logger.new(STDOUT)
  logger.formatter = config.log_formatter
  config.logger    = ActiveSupport::TaggedLogging.new(logger)
  config.log_to = %w[stdout file]
end

# Development logging configuration
Logging::Rails.configure do |config|
  Logging.init %w[debug info warn error fatal]
  Logging.format_as :inspect

  # The default layout used by the appenders.
  layout = Logging.layouts.pattern(pattern: '[%d] %-5l %c : %m\n')

  # Configure an appender that will write log events to STDOUT. A colorized
  # pattern layout is used to format the log events into strings before
  # writing.
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

  Logging.logger.root.level = :debug
  Logging.logger.root.appenders = config.log_to unless config.log_to.empty?
end
