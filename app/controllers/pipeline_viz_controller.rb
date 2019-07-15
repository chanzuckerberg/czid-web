class PipelineVizController < ApplicationController
  before_action :authenticate_user!

  current_power do
    Power.new(current_user)
  end

  # GET /pipeline_viz?sampleId=:sampleId
  # GET /pipeline_viz.json?sampleId=:sampleId
  def index
    feature_allowed = current_user.allowed_feature_list.include?("pipeline_viz")
    sample = current_power.samples.find_by(id: params[:sampleId])
    pipeline_run = sample && sample.first_pipeline_run

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
        format.html # index.html.erb
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
