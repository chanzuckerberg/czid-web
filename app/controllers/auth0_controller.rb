# frozen_string_literal: true

class Auth0Controller < ApplicationController
  skip_before_action :authenticate_user!

  include Auth0Helper

  def sign_in
    redirect_to 'auth/auth0'
  end

  def sign_out
    domain = Rails.application.secrets.auth0_domain
    client_id = Rails.application.secrets.auth0_client_id
    request_params = {
      returnTo: root_url,
      client_id: client_id,
    }
    URI::HTTPS.build(host: domain, path: '/v2/logout', query: request_params.to_query)
  end

  def callback
    # This stores all the user information that came from Auth0
    # and the IdP
    assign_auth0_session(request.env['omniauth.auth'].credentials.id_token)

    # Redirect to the URL you want after successful auth
    redirect_to "/home"
  end

  def failure
    # Show a failure page or redirect to an error page
    # This endpoint is invoked by auth0 in cases of errors
    @error_msg = request.params['message']
    render
  end
end
