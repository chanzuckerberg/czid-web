class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  protect_from_forgery with: :null_session
 
  def after_sign_out_path_for(_resource_or_scope)
    root_path
  end
end
