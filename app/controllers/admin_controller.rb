class AdminController < ApplicationController
  before_action :login_required
  before_action :admin_required

  def index
    render 'home/discovery_view_router'
  end

  def settings
    render 'home/discovery_view_router'
  end

  def projects
    render 'home/discovery_view_router'
  end

  def samples
    render 'home/discovery_view_router'
  end
end
