class SnapshotLinksController < ApplicationController
  include SamplesHelper

  before_action :app_config_required
  before_action :check_snapshot_exists, only: [:show, :destroy]
  skip_before_action :authenticate_user!, only: [:show]
  before_action only: [:create, :destroy] do
    allowed_feature_required("edit_snapshot_links")
  end

  # GET /pub/:share_id
  def show
    @share_id = snapshot_links_params[:share_id]
    @project_id = @snapshot.project_id
    @project_name = Project.find(@snapshot.project_id).name
    render template: "home/snapshot"
  end

  # POST /pub/projects/:project_id/create
  def create
    project_id = snapshot_links_params[:project_id]
    editable_project = current_power.updatable_projects.find_by(id: project_id)
    if editable_project.nil?
      render json: {
        error: "You are not authorized to turn on view-only sharing.",
      }, status: :unauthorized
    else
      share_id = SnapshotLink.generate_random_share_id
      content = format_snapshot_content(project_id)

      snapshot_link = SnapshotLink.new(
        share_id: share_id,
        project_id: project_id,
        creator_id: current_user.id,
        content: content
      )

      snapshot_link.save!
      render json: { share_id: share_id, created_at: snapshot_link.created_at.to_s }, status: :ok
    end
  rescue => e
    LogUtil.log_backtrace(e)
    LogUtil.log_err_and_airbrake("Unexpected issue creating snapshot: #{e}")
    render json: { error: e }, status: :internal_server_error
  end

  # DELETE /pub/:share_id/destroy
  def destroy
    project_id = @snapshot.project_id
    editable_project = current_power.updatable_projects.find_by(id: project_id)
    if editable_project.nil?
      render json: {
        error: "You are not authorized to turn off view-only sharing.",
      }, status: :unauthorized
    else
      @snapshot.destroy!
      render json: { head: :no_content }
    end
  rescue => e
    LogUtil.log_backtrace(e)
    LogUtil.log_err_and_airbrake("Unexpected issue deleting snapshot: #{e}")
    render json: { error: e }, status: :internal_server_error
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

  def format_snapshot_content(project_id)
    # content stored as
    # {"samples":
    #   [{1: {"pipeline_run_id": 12345}},
    #    {2: {"pipeline_run_id": 12345}}]
    # }
    samples = []
    sample_ids = current_power.samples.where(project_id: project_id).pluck(:id)
    top_pipeline_run_by_sample_id = top_pipeline_runs_multiget(sample_ids)
    top_pipeline_run_by_sample_id.each do |sample_id, pipeline_run|
      samples << { sample_id.to_s => { "pipeline_run_id" => pipeline_run.id } }
    end
    { "samples" => samples }.to_json
  end

  def snapshot_links_params
    permitted_params = [:share_id, :project_id]
    params.permit(*permitted_params)
  end
end
