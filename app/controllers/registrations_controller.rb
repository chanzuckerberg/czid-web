class RegistrationsController < Devise::RegistrationsController  
  protected
  clear_respond_to 
  respond_to :json
  

end 