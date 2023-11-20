class IdentityController < ApplicationController
  before_action :login_required

  TOKEN_AUTH_SERVICE = "scripts/token_auth.py".freeze

  class AuthTokenError < StandardError
    def initialize(error)
      super("Command to generate an authentication token failed (#{TOKEN_AUTH_SERVICE}). Error: #{error}")
    end
  end

  def identify
    user_id = User.find(current_user.id).id.to_s
    stdout, stderr, status = Open3.capture3(
      "python3", TOKEN_AUTH_SERVICE, "--create_token",
      "--userid", user_id
    )

    unless status.success?
      raise AuthTokenError, stderr
    end

    token_info = JSON.parse(stdout)
    cookies[:czid_services_token] = {
      value: token_info["token"],
      expires: Time.zone.at(token_info["expires_at"]),
    }

    render json: { expires_at: token_info["expires_at"] }, status: :ok
  end
end
