class SessionsController < Devise::SessionsController
  respond_to :json

  skip_before_action :verify_authenticity_token, only: [:destroy]
  skip_before_action :verify_signed_out_user, only: [:destroy]

  include Auth0Helper

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
