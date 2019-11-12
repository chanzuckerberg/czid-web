class SessionsController < Devise::SessionsController
  respond_to :json

  skip_before_action :verify_authenticity_token, only: [:destroy]

  include Auth0Helper

  # This method is invoked by Devise when /users/sign_in is invoked
  # to authenticate using legacy devise method. In this situation
  # we need to logout user from auth0 first to prevent it
  # from being authenticated using both strategies at once
  def new
    result = auth0_logout
    if result[:using_auth0]
      redirect_to result[:auth0_logout_url]
    else
      super
    end
  end

  def after_sign_out_path_for(resource_name)
    if @auth0_logout_result&.fetch(:using_auth0)
      @auth0_logout_result[:auth0_logout_url]
    else
      super
    end
  end

  def destroy
    @auth0_logout_result = auth0_logout
    super
  end
end
