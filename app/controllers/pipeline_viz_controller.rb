class PipelineVizController < ApplicationController
  include PipelineOutputsHelper

  before_action :authenticate_user!

  # GET /sample/:sample_id/pipeline_viz/:pipeline_version
  # GET /sample/:sample_id/pipeline_viz/:pipeline_version.json
  def show
    feature_allowed = current_user.allowed_feature_list.include?("pipeline_viz")
    @show_experimental = current_user.allowed_feature_list.include?("pipeline_viz_experimental") || current_user.admin?
    if feature_allowed
      sample = current_power.samples.find_by(id: params[:sample_id])
      pipeline_version = params[:pipeline_version]
      pipeline_run = sample && (
        pipeline_version ? sample.pipeline_run_by_version(pipeline_version) : sample.first_pipeline_run
      )

      if pipeline_run
        @results = RetrievePipelineVizGraphDataService.call(pipeline_run.id, @show_experimental, current_user.id != sample.user_id)
        @pipeline_versions = sample.pipeline_versions
        @last_processed_at = pipeline_run.created_at
        @pipeline_run_display = curate_pipeline_run_display(pipeline_run)
        @sample = {
          id: sample.id,
          name: sample.name,
          upload_error: sample.upload_error,
        }
        respond_to do |format|
          format.html
          format.json { render json: @results }
        end
        return
      end
    end
    status = !feature_allowed ? :unauthorized : :not_found
    render(json: {
             status: status,
             message: "Cannot access feature",
           }, status: status)
  end
end
