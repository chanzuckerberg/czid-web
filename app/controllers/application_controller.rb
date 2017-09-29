class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def login_required
    redirect_to '/users/sign_in' unless current_user
    @user = current_user
  end
end
