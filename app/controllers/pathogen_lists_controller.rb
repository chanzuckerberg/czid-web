class PathogenListsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:show]

  # GET /pathogen_list
  def show
    render "home/discovery_view_router"
  end
end
