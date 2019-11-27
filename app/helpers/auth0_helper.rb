module Auth0Helper
  def auth0_logout
    # Check presence of Auth0Helper#auth0_session
    if auth0_session.present?
      auth0_remove_application_session
      true
    else
      false
    end
  end

  def auth0_decode_auth_token
    auth_payload, auth_header = auth_token
    if auth_payload.present?
      { authenticated: true, auth_payload: auth_payload, auth_header: auth_header }
    end
  rescue JWT::VerificationError, JWT::DecodeError
    { authenticated: false }
  end

  def auth0_session
    session[:auth0_credentials]
  end

  delegate :present?, to: :auth0_session, prefix: true

  def auth0_session=(value)
    session[:auth0_credentials] = value.present? && value["id_token"].present? ? value : nil
  end

  protected

  # Remove auth0 session from Application Session Layer
  # (see https://auth0.com/docs/sessions/concepts/session-layers)
  def auth0_remove_application_session
    session.delete(:auth0_credentials)
    sign_out_all_scopes
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

  def http_token
    if request.headers['Authorization'].present?
      request.headers['Authorization'].split(' ').last
    elsif auth0_session.present?
      auth0_session["id_token"]
    end
  end

  def auth_token
    token = http_token
    JsonWebToken.verify(token) if token
  end
end
