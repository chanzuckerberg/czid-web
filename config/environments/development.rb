require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Eager load against default recs. Worth re-evaluating, was set a long time ago.
  config.eager_load = true

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable server timing
  config.server_timing = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if Rails.root.join("tmp/caching-dev.txt").exist?
    config.action_controller.perform_caching = true
    config.action_controller.enable_fragment_cache_logging = true

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
      "Cache-Control" => "public, max-age=#{2.days.to_i}",
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.service = :local

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.action_mailer.perform_caching = false

  # CZID specific
  # Required for tests to pass
  config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  config.active_record.verbose_query_logs = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true

  # Using default file watcher because inotify does not work with arm64
  # dev environments.  If inotify eventually works with arm64 on qemu, consider
  # switching back to the EventedFileUpdateChecker
  config.file_watcher = ActiveSupport::FileUpdateChecker

  config.action_controller.asset_host = proc { |source|
    "http://localhost:8080" if source =~ /wp_bundle\.js$/i
  }
  # Uncomment if you wish to allow Action Cable access from any origin.
  # config.action_cable.disable_request_forgery_protection = true

  # Here down is CZID-added code, not Rails-generated
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
  config.hosts << "web.czidnet"

  # SERVER_DOMAIN is used for callback URLs for ECS bulk downloads
  # In local development, an ngrok http endpoint must be configured for ECS bulk downloads to work
  # See https://github.com/chanzuckerberg/czid-web-private/wiki/1.6-Dev-%E2%80%90-ECS-Bulk-Downloads-on-Localdev
  # This setting prevents Rails from blocking requests to the ngrok endpoint
  config.hosts << ENV["SERVER_DOMAIN"].sub("https://", "") if ENV["SERVER_DOMAIN"]

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
