class PipelineVizController < ApplicationController
  before_action :authenticate_user!

  # GET /sample/:sample_id/pipeline_viz/:pipeline_version
  # GET /sample/:sample_id/pipeline_viz/:pipeline_version.json
  def show
    feature_allowed = current_user.allowed_feature_list.include?("pipeline_viz")
    if feature_allowed
      sample = current_power.samples.find_by(id: params[:sample_id])
      pipeline_version = params[:pipeline_version]
      pipeline_run = sample && (
        pipeline_version ? sample.pipeline_run_by_version(pipeline_version) : sample.first_pipeline_run
      )

      if pipeline_run
        @results = RetrievePipelineVizGraphDataService.call(pipeline_run.id, current_user.admin?)
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
             message: "Cannot access feature"
           }, status: status)
  end
end
