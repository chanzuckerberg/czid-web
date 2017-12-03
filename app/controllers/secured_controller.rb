class SecuredController < ApplicationController
  before_action :authenticate_user!
  protect_from_forgery with: :exception
  protect_from_forgery with: :null_session
end
