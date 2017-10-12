class SessionsController < Devise::SessionsController
  respond_to :json
  prepend_before_action :verify_user, only: [:destroy]
  
    private
    ## This method intercepts SessionsController#destroy action 
    ## If a signed in user tries to sign out, it allows the user to sign out 
    ## If a signed out user tries to sign out again, it redirects them to sign in page
    def verify_user
      ## redirect to appropriate path
      redirect_to new_user_session_path, notice: 'You have already signed out. Please sign in again.' and return unless user_signed_in?
    end
end
