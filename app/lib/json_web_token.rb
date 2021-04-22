# frozen_string_literal: true

require 'net/http'
require 'uri'

class JsonWebToken
  AUTH0_DOMAIN = ENV["AUTH0_DOMAIN"]
  AUTH0_CLIENT_ID = ENV["AUTH0_CLIENT_ID"]

  AUTH0_CLI_AUDIENCE = ENV["AUTH0_CLI_AUDIENCE"]
  AUTH0_CLI_ISSUER = ENV["AUTH0_CLI_ISSUER"]

  JWT_JWKS_KEYS_URL = "https://#{AUTH0_DOMAIN}/.well-known/jwks.json"
  JWT_TOKEN_ISS = "https://#{AUTH0_DOMAIN}/"

  @jwks_hash_cache = {}

  def self.verify_application(token)
    verify(token, AUTH0_CLIENT_ID, JWT_TOKEN_ISS)
  end

  def self.verify_cli(token)
    verify(token, AUTH0_CLI_AUDIENCE, AUTH0_CLI_ISSUER)
  end

  # Retrieve jwks key for a specific key id
  # This method keeps a cached version of jwks and refreshes the jwks hash from auth0
  # if the key id is not present on the cache
  def self.cached_jwks(kid)
    return @jwks_hash_cache[kid] if @jwks_hash_cache.key?(kid)

    @jwks_hash_cache = jwks_hash
    @jwks_hash_cache[kid]
  end

  # Fetches the jwks hash from auth0
  def self.jwks_hash
    Rails.logger.info("Fetching jwks_hash at #{JWT_JWKS_KEYS_URL}")
    # only trigger this flow if the app is configured to use SSRFs UP
    # until it's tested in staging a bit, it currently just invokes the lambda
    # and calls the old behavior. We'll use lambda metrics to see how it is working.
    jwks_raw = if AppConfigHelper.get_app_config(AppConfig::ENABLE_SSRFS_UP) == "1"
                 SSRFsUp.get(JWT_JWKS_KEYS_URL).body
               else
                 Net::HTTP.get URI(JWT_JWKS_KEYS_URL)
               end

    jwks_keys = Array(JSON.parse(jwks_raw)['keys'])
    Hash[
      jwks_keys.map do |k|
        [
          k['kid'],
          OpenSSL::X509::Certificate.new(
            Base64.decode64(k['x5c'].first)
          ).public_key,
        ]
      end
    ]
  end

  # Verify the signature of JWT token using jwks keys retrieved from Auth0
  # https://auth0.com/docs/jwks
  def self.verify(token, audience, iss)
    JWT.decode(
      token, nil,
      true, # Verify the signature of this token
      algorithm: 'RS256',
      iss: iss,
      verify_iss: true,
      aud: audience,
      verify_aud: true
    ) do |header|
      cached_jwks(header['kid'])
    end
  end

  private_class_method :verify
end
