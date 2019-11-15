# frozen_string_literal: true

class Auth0Controller < ApplicationController
  skip_before_action :authenticate_user!, :verify_authenticity_token

  include Auth0Helper

  def callback
    # Store the user token that came from Auth0 and the IdP
    # Auth0Helper#auth0_session
    self.auth0_session = request.env['omniauth.auth'].credentials.id_token

    # Redirect to the URL you want after successful auth
    redirect_to home_path
  end

  def remove_auth0_session
    # Invalidate auth0 session (https://auth0.com/docs/sessions/concepts/session-layers)
    redirect_to auth0_signout_url
  end
end
