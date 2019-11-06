module Auth0Helper
  def auth0_logout
    # Check presence of Auth0Helper#auth0_session
    if auth0_session.present?
      session.delete(:jwt_id_token)
      { using_auth0: true, auth0_logout_url: auth0_signout_url }
    else
      { using_auth0: false }
    end
  end

  def check_auth0_auth_token
    auth_payload, auth_header = auth_token
    if auth_payload.present?
      { authenticated: true, auth_payload: auth_payload, auth_header: auth_header }
    end
  rescue JWT::VerificationError, JWT::DecodeError
    return { authenticated: false }
  end

  def auth0_session
    session[:jwt_id_token]
  end

  delegate :present?, to: :auth0_session, prefix: true

  def auth0_session=(value)
    session[:jwt_id_token] = value
  end

  protected

  def auth0_signout_url
    domain = ENV["AUTH0_DOMAIN"]
    client_id = ENV["AUTH0_CLIENT_ID"]
    qry_prms = { returnTo: root_url, client_id: client_id }
    url = URI::HTTPS.build(host: domain, path: '/v2/logout', query: qry_prms.to_query)
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
