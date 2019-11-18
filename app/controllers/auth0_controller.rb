# frozen_string_literal: true

class Auth0Controller < ApplicationController
  skip_before_action :authenticate_user!, :verify_authenticity_token, :sign_in_auth0_token!

  include Auth0Helper

  SUPPORTED_MODES = Set[
    "background_refresh", # Background token refresh in a hidden iframe
    "login", # Invoked during login callback
    "expired", # Invoked when the token in the application session is expired / invalid
    "reset_password", # Invoked after reseting password operation
  ].freeze

  def refresh_token
    @mode = filter_value(params["mode"], SUPPORTED_MODES)
    render :refresh_token, layout: false
  end

  def background_refresh
    @mode = params["mode"]
    @refresh_values = background_refresh_values
    render :background_refresh, layout: false
  end

  def callback
    # Store the user token that came from Auth0 and the IdP
    # Auth0Helper#auth0_session
    self.auth0_session = request.env['omniauth.auth']&.credentials.to_h

    if auth0_session.nil?
      redirect_to auth0_signout_url
    else
      # https://github.com/omniauth/omniauth-oauth2/issues/31#issuecomment-23806447
      mode = filter_value(request.env['omniauth.params']['mode'], SUPPORTED_MODES)

      @auth0_token = auth0_decode_auth_token

      case mode
      when "background_refresh"
        redirect_to action: :background_refresh
      when "login", "expired"
        redirect_to home_path
      when "reset_password"
        redirect_to root_path
      else
        redirect_to root_path
      end
    end
  end

  def remove_auth0_session
    # Invalidate auth0 session (https://auth0.com/docs/sessions/concepts/session-layers)
    redirect_to auth0_signout_url
  end

  def request_password_reset
    email = params.dig("user", "email")
    return if email.blank?

    # Send them a password reset email via Auth0 if enabled or the legacy Devise flow.
    if get_app_config(AppConfig::USE_AUTH0_FOR_NEW_USERS) == "1"
      User.send_auth0_password_reset_email(email)
      redirect_to auth0_login_url
    else
      # DEPRECATED: Legacy Devise flow. Remove block after migrating to Auth0.
      user = User.find_by(email: email)
      if user
        user.send_reset_password_instructions
      end
      # Old login page
      redirect_to new_user_session_path
    end
  end

  private

  def filter_value(value, set_of_values)
    value if set_of_values.include?(value)
  end

  def background_refresh_values
    @auth0_token = auth0_decode_auth_token
    if @auth0_token && @auth0_token[:auth_payload]
      exp = @auth0_token[:auth_payload]["exp"]
      iat = @auth0_token[:auth_payload]["iat"] || (exp - 15.minutes.in_seconds)
      lifespan = exp - iat
      expires_in = exp - Time.now.to_i
      should_refresh_in = expires_in - (lifespan * 0.2).to_i
      should_refresh = should_refresh_in < 0
      expired = expires_in <= 0
    else
      lifespan = 0
      should_refresh = true
      expired = true
    end
    {
      active: auth0_session.present?,
      exp: exp || 0,
      iat: iat || 0,
      lifespan: lifespan,
      expires_in: expires_in || 0,
      should_refresh_in: should_refresh_in || 0,
      should_refresh: should_refresh,
      expired: expired,
      refresh_endpoint: "/auth0/refresh_token?mode=background_refresh",
      reload_wait_seconds: [lifespan / 2, (15.minutes / 1.second)].min,
    }
  end
end
