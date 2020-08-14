class SnapshotLinksController < ApplicationController
  before_action :app_config_required, :check_snapshot_exists, only: [:show]
  skip_before_action :authenticate_user!, only: [:show]
  before_action only: :create do
    allowed_feature_required("edit_snapshot_links")
  end

  def show
    @share_id = snapshot_links_params[:share_id]
    @project_id = @snapshot.project_id
    @project_name = Project.find(@snapshot.project_id).name
    render template: "home/snapshot"
  end

  def create
  end

  private

  def block_action
    redirect_to root_path
  end

  def app_config_required
    unless get_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING) == "1"
      block_action
    end
  end

  def check_snapshot_exists
    @snapshot = SnapshotLink.find_by(share_id: snapshot_links_params[:share_id])
    if @snapshot.blank?
      block_action
    end
  end

  def snapshot_links_params
    permitted_params = [:share_id]
    params.permit(*permitted_params)
  end
end
