class AdminController < ApplicationController
  before_action :login_required
  before_action :admin_required

  def index
  end

  def settings
  end

  def projects
  end

  def samples
  end
end
