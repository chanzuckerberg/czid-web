class ApplicationController < ActionController::Base
  before_action :authenticate_user!
  protect_from_forgery with: :exception
  protect_from_forgery with: :null_session

  def after_sign_out_path_for(_resource_or_scope)
    root_path
  end

  def admin_required
    redirect_to root_path unless current_user && current_user.admin?
  end
end
