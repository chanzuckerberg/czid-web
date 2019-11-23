## Configure Rack CORS Middleware, so that CloudFront can serve our assets.
## See https://github.com/cyu/rack-cors
## And see https://stackoverflow.com/a/36585871
if defined? Rack::Cors
  Rails.configuration.middleware.insert_before 0, Rack::Cors do
    allow do
      origins [
        # SERVER_DOMAIN should be set to the current env root web address
        # such as https://staging.idseq.net/
        ENV["SERVER_DOMAIN"] || "",
        # Add all expected origins to be safe
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://idseq.net",
        "https://www.idseq.net",
        "https://staging.idseq.net",
        "https://www.staging.idseq.net",
        # Add CloudFront domains
        "https://assets.idseq.net",
        "https://assets.staging.idseq.net",
      ]
      resource '/assets/*'
    end
  end
end
