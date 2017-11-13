class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  protect_from_forgery with: :null_session
  # before_action :set_user

  # def login_required
  #   redirect_to '/users/sign_in' unless current_user
  # end

  # def set_user
  #   @user = current_user if current_user && current_user.id
  # end

  # def after_sign_out_path_for(_resource_or_scope)
  #   root_path
  # end
end
