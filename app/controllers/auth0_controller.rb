# frozen_string_literal: true

class Auth0Controller < ApplicationController
  skip_before_action :authenticate_user!

  def sign_in
    redirect_to 'auth/auth0'
  end

  def callback
    # This stores all the user information that came from Auth0
    # and the IdP
    session[:jwt_id_token] = request.env['omniauth.auth'].credentials.id_token

    # Redirect to the URL you want after successful auth
    redirect_to "/home"
  end

  def failure
    # show a failure page or redirect to an error page
    @error_msg = request.params['message']
  end
end
