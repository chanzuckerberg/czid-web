## Configure Rack CORS Middleware, so that CloudFront can serve our assets.
## See https://github.com/cyu/rack-cors
## And see https://stackoverflow.com/a/36585871
if defined? Rack::Cors
  Rails.configuration.middleware.insert_before 0, Rack::Cors do
    allow do
      origins [
        # SERVER_DOMAIN should be set to the current env root web address
        # such as https://staging.idseq.net/
        ENV["SERVER_DOMAIN"],
        *Rails.application.config.allowed_cors_origins,
        # All other domains should be added in env config files such as prod.rb.
      ].compact
      resource '/assets/*'
    end
  end
end
