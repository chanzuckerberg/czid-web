class UrlUtil
  # Uses action_mailer config values on the assumption that we always want our
  # absolute URLs to be the same in emails and in other places.
  def self.absolute_base_url
    options = Rails.application.config.action_mailer.default_url_options
    host = options[:host]
    port = options[:port]
    protocol = options[:protocol]
    if protocol.nil?
      protocol = Rails.application.config.force_ssl ? "https" : "http"
    end
    port = port ? ":#{port}" : ""
    "#{protocol}://#{host}#{port}"
  end
end
