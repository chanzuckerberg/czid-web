# frozen_string_literal: true

class Auth0Controller < ApplicationController
  skip_before_action :authenticate_user!

  include Auth0Helper

  def sign_in
    # This route is automatic defined by OmniAuth
    redirect_to 'auth/auth0'
  end

  def sign_out
    if auth0_session_present?
      session.delete(:jwt_id_token)

      domain = Rails.application.secrets.auth0_domain
      client_id = Rails.application.secrets.auth0_client_id
      qry_prms = { returnTo: root_url, client_id: client_id }
      url = URI::HTTPS.build(host: domain, path: '/v2/logout', query: qry_prms.to_query)
      redirect_to url.to_s
    else
      redirect_to root_path
    end
  end

  def callback
    # Store the user token that came from Auth0 and the IdP
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
