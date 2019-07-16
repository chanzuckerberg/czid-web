class PipelineVizController < ApplicationController
  before_action :authenticate_user!

  # GET /sample/:sample_id/pipeline_viz/:pipeline_version
  # GET /sample/:sample_id/pipeline_viz/:pipeline_version.json
  def show
    feature_allowed = current_user.allowed_feature_list.include?("pipeline_viz")
    sample = current_power.samples.find_by(id: params[:sample_id])
    pipeline_version = params[:pipeline_version]
    pipeline_run = sample && (
      pipeline_version ? sample.pipeline_runs.where(pipeline_version: pipeline_version)[0] : sample.first_pipeline_run
    )

    if feature_allowed && pipeline_run
      stage_info = {}
      pipeline_run.pipeline_run_stages.each do |stage|
        if stage.name != "Experimental" || current_user.admin?
          stage_info[stage.name] = JSON.parse(stage.dag_json || "{}")
          stage_info[stage.name][:job_status] = stage.job_status
        end
      end

      @results = {
        pipeline_version: pipeline_run.pipeline_version,
        stages: stage_info
      }
      respond_to do |format|
        format.html
        format.json { render json: @results }
      end
    else
      status = !feature_allowed ? :unauthorized : :not_found
      render(json: {
               status: status,
               message: "Cannot access feature"
             }, status: status)
    end
  end
end
