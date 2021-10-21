class PathogenListsController < ApplicationController
  before_action :app_config_required
  skip_before_action :authenticate_user!, only: [:show]
  before_action :set_list_version, only: :show

  # GET /pathogen_list
  def show
    respond_to do |format|
      format.html do
        render "home/discovery_view_router"
      end

      format.json do
        if @list_version.present?
          render(
            json: {
              version: @list_version.version,
              updated_at: @list_version.updated_at.strftime("%b %d, %Y"),
              pathogens: @list_version.fetch_pathogens_info,
              citations: @list_version.fetch_citation_footnotes,
            },
            status: :ok
          )
        else
          render json: {}, status: :not_found
        end
      end
    end
  end

  private

  def block_action
    redirect_to page_not_found_path
  end

  def set_list_version
    global_pathogen_list = PathogenList.find_by(is_global: true)
    @list_version = nil
    if global_pathogen_list.present?
      version = pathogen_list_params[:version]
      @list_version = global_pathogen_list.fetch_list_version(version)
    end
  end

  def app_config_required
    launched = AppConfigHelper.get_json_app_config(AppConfig::LAUNCHED_FEATURES, [])
    unless launched.include?("pathogen_list_v0")
      block_action
    end
  end

  def pathogen_list_params
    permitted_params = [:version]
    params.permit(*permitted_params)
  end
end
