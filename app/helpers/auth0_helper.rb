# frozen_string_literal: true

module Auth0Helper
  NOT_AUTHENTICATED = { authenticated: false }.freeze

  AUTH_INVALID_USER = 'AUTH_INVALID_USER'
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED'
  AUTH_VALID = 'AUTH_VALID'

  # This is just a unique namespace for custom claims and it is not linked to any specific environment
  CUSTOM_CLAIMS_NAMESPACE = "https://idseq.net"
  ROLES_CUSTOM_CLAIM = "#{CUSTOM_CLAIMS_NAMESPACE}/roles"

  def auth0_check_user_auth(current_user)
    if current_user.blank?
      return AUTH_INVALID_USER
    else
      # regular request, check auth0 token to see if it is expired
      auth_token = auth0_decode_auth_token

      wrong_email = auth_token.dig(:auth_payload, "email") != current_user.email
      expired = !auth_token[:authenticated]

      # for admin users, ensure that auth0 JWT token matches the local database.
      # this field is a custom claim set in "Add roles custom claims to JWT" rule in auth0
      wrong_role = current_user.admin? && !(auth_token.dig(:auth_payload, ROLES_CUSTOM_CLAIM) || []).include?('admin')
      if wrong_role && !expired && !wrong_email
        LogUtil.log_error("Wrong auth0 role for admin user #{current_user.email}", user_email: current_user.email)
      end

      return AUTH_TOKEN_EXPIRED if expired
      return AUTH_INVALID_USER if wrong_email || wrong_role
    end

    AUTH_VALID
  end

  def auth0_authenticate_with_bearer_token(bearer_token)
    self.auth0_session = bearer_token
    access_token = auth0_decode_auth_token
    if access_token[:authenticated]
      auth_payload = access_token[:auth_payload]
      auth_user = User.find_by(email: auth_payload["email"])
      # logout users from previous Devise scope
      warden.logout(:user)
      warden.set_user(auth_user, scope: :auth0_user)
      true
    else
      auth0_invalidate_application_session
      false
    end
  end

  def auth0_decode_auth_token
    auth_payload, auth_header = auth_token
    if auth_payload.present?
      { authenticated: true, auth_payload: auth_payload, auth_header: auth_header }
    else
      NOT_AUTHENTICATED
    end
  rescue JWT::VerificationError, JWT::DecodeError
    # Signature doesn't match or token is expired
    NOT_AUTHENTICATED
  end

  def auth0_session
    session[:auth0_credentials]
  end

  delegate :present?, to: :auth0_session, prefix: true

  # Remove auth0 session from Application Session Layer
  # (see https://auth0.com/docs/sessions/concepts/session-layers)
  def auth0_invalidate_application_session
    session.delete(:auth0_credentials)
    begin
      warden.logout(:auth0_user)
      # logout users from previous Devise scope
      warden.logout(:user)
    rescue StandardError => e
      Rails.logger.error("Warden failed to logout session: #{e}")
      # if warden middleware is not present for any reason
      # we want to ensure we removed everything from current session
      # to prevent infinite redirects
      reset_session
    end
  end

  # URL used to remove auth0 session from Auth0 Session Layer
  # (see https://auth0.com/docs/sessions/concepts/session-layers)
  def auth0_signout_url(return_to = root_url)
    domain = ENV["AUTH0_DOMAIN"]
    client_id = ENV["AUTH0_CLIENT_ID"]
    qry_prms = { returnTo: return_to, client_id: client_id }
    url = URI::HTTPS.build(host: domain, path: '/v2/logout', query: qry_prms.to_query)
    url.to_s
  end

  private

  def auth0_session=(value)
    session[:auth0_credentials] = value.present? && value["id_token"].present? ? value.except("token") : nil
  end

  def http_token
    if auth0_session.present?
      auth0_session["id_token"]
    end
  end

  def auth_token
    token = http_token
    return unless token

    if @auth0_cli_auth
      JsonWebToken.verify_cli(token)
    else
      JsonWebToken.verify_application(token)
    end
  end
end
