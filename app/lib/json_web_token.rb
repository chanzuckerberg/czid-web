# frozen_string_literal: true

require 'net/http'
require 'uri'

class JsonWebToken
  AUTH0_DOMAIN = ENV["AUTH0_DOMAIN"]
  AUTH0_CLIENT_ID = ENV["AUTH0_CLIENT_ID"]

  JWT_JWKS_KEYS_URL = "https://#{AUTH0_DOMAIN}/.well-known/jwks.json"
  JWT_TOKEN_ISS = "https://#{AUTH0_DOMAIN}/"

  def self.decode_without_verification(token)
    JWT.decode(token, nil, false)
  end

  def self.verify(token)
    JWT.decode(
      token, nil,
      true, # Verify the signature of this token
      algorithm: 'RS256',
      iss: JWT_TOKEN_ISS,
      verify_iss: true,
      aud: AUTH0_CLIENT_ID,
      verify_aud: true
    ) do |header|
      jwks_hash[header['kid']]
    end
  end

  def self.jwks_hash
    jwks_raw = Net::HTTP.get URI(JWT_JWKS_KEYS_URL)
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
end
