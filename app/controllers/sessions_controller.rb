class SessionsController < Devise::SessionsController
  respond_to :json

  include Auth0Helper

  skip_before_action :verify_authenticity_token, only: [:destroy]

  # Skip devise verify_signed_out_user when logging out an auth0 session
  # https://stackoverflow.com/questions/26241357/overriding-devise-sessionscontroller-destroy
  skip_before_action :verify_signed_out_user, only: [:destroy]
  before_action :verify_signed_out_user, only: [:destroy], if: -> { auth0_session.present? }

  # This method is invoked by Devise when /users/sign_in is invoked
  # to authenticate using legacy devise method. In this situation
  # we need to logout user from auth0 first to prevent it
  # from being authenticated using both strategies at once
  def new
    if auth0_logout
      redirect_to after_sign_out_path_for(:user)
    else
      super
    end
  end

  def after_sign_out_path_for(resource_name)
    # if user has been logged out from auth0 (SessionsController#destroy)
    # we need to redirect them to auth0 sign out url to remove user's session from auth0 layer
    if @auth0_logout_result
      auth0_signout_url
    else
      super
    end
  end

  def destroy
    @auth0_logout_result = auth0_logout
    super
  end
end
