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
    config.session_store = :cookie_store, {
      key: '_czid_session',
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

  # Using default file watcher because inotify does not work with arm64
  # dev environments.  If inotify eventually works with arm64 on qemu, consider
  # switching back to the EventedFileUpdateChecker
  config.file_watcher = ActiveSupport::FileUpdateChecker

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

  # web is the container name for the rails server in our docker config
  # Rails > 6 requires hosts to be explicitly allow listed
  config.hosts << "web"

  # Development logging configuration
  logger           = ActiveSupport::Logger.new(STDOUT)
  logger.formatter = config.log_formatter
  config.logger    = ActiveSupport::TaggedLogging.new(logger)
  config.log_to = %w[stdout file]
  config.active_record.verbose_query_logs = true

  config.after_initialize do
    Bullet.enable = true
    Bullet.bullet_logger = true
    Bullet.console = true
    Bullet.rails_logger = true
    Bullet.skip_html_injection = false
  end
end
