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
    auth0_remove_application_session
    { authenticated: false }
  end

  def auth0_session
    session[:jwt_id_token]
  end

  delegate :present?, to: :auth0_session, prefix: true

  def auth0_session=(value)
    session[:jwt_id_token] = value
  end

  protected

  # Remove auth0 session from Application Session Layer
  # (see https://auth0.com/docs/sessions/concepts/session-layers)
  def auth0_remove_application_session
    reset_session
  end

  # URL used to remove auth0 session from Auth0 Session Layer
  # (see https://auth0.com/docs/sessions/concepts/session-layers)
  def auth0_signout_url
    domain = ENV["AUTH0_DOMAIN"]
    client_id = ENV["AUTH0_CLIENT_ID"]
    qry_prms = { returnTo: root_url, client_id: client_id }
    url = URI::HTTPS.build(host: domain, path: '/v2/logout', query: qry_prms.to_query)
    url.to_s
  end

  # See: https://auth0.com/docs/api/authentication#authorization-code-flow
  def auth0_login_url
    client_id = ENV["AUTH0_CLIENT_ID"]
    connection = ENV["AUTH0_CONNECTION"]
    domain = ENV["AUTH0_DOMAIN"]
    request_params = {
      client_id: client_id,
      connection: connection,
      redirect_uri: URI.join(root_url, 'auth/auth0/callback').to_s,
      response_type: "code",
    }
    url = URI::HTTPS.build(host: domain,
                           path: '/authorize',
                           query: request_params.to_query)
    url.to_s
  end

  private

  def http_token
    if request.headers['Authorization'].present?
      request.headers['Authorization'].split(' ').last
    else
      session[:jwt_id_token]
    end
  end

  def auth_token
    token = http_token
    JsonWebToken.verify(token) if token
  end
end
