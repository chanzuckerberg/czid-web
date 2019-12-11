module Auth0Helper
  NOT_AUTHENTICATED = { authenticated: false }.freeze

  def auth0_authenticate_with_bearer_token(bearer_token)
    self.auth0_session = bearer_token
    access_token = auth0_decode_auth_token
    if access_token[:authenticated]
      auth_payload = access_token[:auth_payload]
      auth_user = User.find_by(email: auth_payload["email"])
      warden.set_user(auth_user, scope: :user)
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
    warden&.logout(:user)
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
    session[:auth0_credentials] = value.present? && value["id_token"].present? ? value : nil
  end

  def http_token
    if auth0_session.present?
      auth0_session["id_token"]
    end
  end

  def auth_token
    token = http_token
    JsonWebToken.verify(token) if token
  end
end
