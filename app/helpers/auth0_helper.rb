module Auth0Helper
  def check_auth0_auth_token
    auth_payload, auth_header = auth_token
    if auth_payload.present?
      { authenticated: true, auth_payload: auth_payload, auth_header: auth_header }
    end
  rescue JWT::VerificationError, JWT::DecodeError
    return { authenticated: false }
  end

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

  def assign_auth0_session(value)
    session[:jwt_id_token] = value
  end
end
