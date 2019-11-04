module Auth0Helper
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
    domain = Rails.application.secrets.auth0_domain
    client_id = Rails.application.secrets.auth0_client_id
    request_params = {
      returnTo: root_url,
      client_id: client_id,
    }
    URI::HTTPS.build(host: domain, path: '/v2/logout', query: request_params.to_query)
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
