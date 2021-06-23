Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # The test environment is used exclusively to run your application's
  # test suite. You never need to work with it otherwise. Remember that
  # your test database is "scratch space" for the test suite and is wiped
  # and recreated between test runs. Don't rely on the data there!
  config.cache_classes = true

  # Do not eager load code on boot. This avoids loading your whole application
  # just for the purpose of running a single test. If you are using a tool that
  # preloads Rails for running tests, you may have to set it to true.
  config.eager_load = false

  # Configure public file server for tests with Cache-Control for performance.
  config.public_file_server.enabled = true
  config.public_file_server.headers = {
    'Cache-Control' => "public, max-age=#{1.hour.seconds.to_i}",
  }

  # Show full error reports and disable caching.
  config.consider_all_requests_local       = true

  # Configure caching to be the same as development
  config.action_controller.perform_caching = true
  config.cache_store = :redis_cache_store,
                       {
                         url: 'redis://redis:6379/0/cache',
                         # Needed for redis to evict keys in volatile-lru mode
                         expires_in: 30.days,
                       }

  # Raise exceptions instead of rendering exception templates.
  config.action_dispatch.show_exceptions = false

  # Disable request forgery protection in test environment.
  config.action_controller.allow_forgery_protection = false

  # Tell Action Mailer not to deliver emails to the real world.
  # The :test delivery method accumulates sent emails in the
  # ActionMailer::Base.deliveries array.
  config.action_mailer.delivery_method = :test

  # Print deprecation notices to the stderr.
  config.active_support.deprecation = :stderr
  config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Custom config for idseq to enable CORS headers by environment. See rack_cors.rb.
  config.allowed_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
  # Any host header is OK in testing
  config.hosts = nil

  ENV["AUTH0_DOMAIN"] = "czi-idseq-fake.idseq.net"
  ENV["AUTH0_CLIENT_ID"] = "FakeAuth0ClientId"
  ENV["AUTH0_CLIENT_SECRET"] = "FakeAuth0ClientSecret"
  ENV["AUTH0_MANAGEMENT_DOMAIN"] = "czi-idseq-fake.idseq.net"
  ENV["AUTH0_MANAGEMENT_CLIENT_ID"] = "FakeAuth0ClientId"
  ENV["AUTH0_MANAGEMENT_CLIENT_SECRET"] = "FakeAuth0ClientSecret"
  ENV["AUTH0_CONNECTION"] = "Username-Password-Authentication"
end
