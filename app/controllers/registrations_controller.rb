class RegistrationsController < Devise::RegistrationsController
  clear_respond_to
  respond_to :json

  protected
  
    def after_sign_up_path_for(resource)
      root_path
    end
end
