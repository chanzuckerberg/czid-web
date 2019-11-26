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

  MIN_TOKEN_REFRESH_IN_SECONDS = 60.seconds.to_i
  MAX_TOKEN_REFRESH_IN_SECONDS = (60.minutes / 1.second).to_i

  AUTH0_CONNECTION_NAME = "Username-Password-Authentication"

  def refresh_token
    @mode = filter_value(params["mode"], SUPPORTED_MODES)
    @prompt = ["expired", "background_refresh"].include?(@mode) ? "none" : "login"
    @connection = AUTH0_CONNECTION_NAME
    render :refresh_token, layout: false
  end

  def login
    # Redirecting to the refresh token forcing a login operation
    redirect_to url_for(
      action: :refresh_token,
      params: { mode: "login" }
    )
  end

  def logout
    auth0_logout
    redirect_to auth0_signout_url
  end

  def failure
    logout
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
      # "iat" is not a mandatory JWT field. Auth0 sends this field, but adding a default in case it is missing
      iat = @auth0_token[:auth_payload]["iat"] || (exp - MAX_TOKEN_REFRESH_IN_SECONDS)
      lifespan = exp - iat
      expires_in = exp - Time.now.to_i
      # We want to preemptively refresh the token before it expires.
      # Half of lifespan or MAX_TOKEN_REFRESH_IN_SECONDS minutes, whatever is shorter.
      should_refresh_in = [expires_in - (lifespan / 2), MAX_TOKEN_REFRESH_IN_SECONDS].min
      should_refresh = should_refresh_in <= 0
      expired = expires_in <= 0
    else
      lifespan = 0
      should_refresh_in = 0
      should_refresh = true
      expired = true
    end

    # background_refresh.html.erb script will reload the page to check
    # if the authentication token is due to a refresh based on this `reload_wait_seconds` parameter.
    # Here we are adjusting this reload time to be at reasonable frequency.
    reload_wait_seconds = [[lifespan / 4, MAX_TOKEN_REFRESH_IN_SECONDS].min, MIN_TOKEN_REFRESH_IN_SECONDS].max

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
      reload_wait_seconds: reload_wait_seconds,
    }
  end
end
