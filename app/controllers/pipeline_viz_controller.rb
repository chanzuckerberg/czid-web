class PipelineVizController < ApplicationController
  include PipelineOutputsHelper

  # GET /sample/:sample_id/pipeline_viz/:pipeline_version
  # GET /sample/:sample_id/pipeline_viz/:pipeline_version.json
  def show
    @show_experimental = current_user.allowed_feature_list.include?("pipeline_viz_experimental") || current_user.admin?
    sample = current_power.samples.find_by(id: params[:sample_id])
    pipeline_version = params[:pipeline_version]
    pipeline_run = sample && (
      pipeline_version ? sample.pipeline_run_by_version(pipeline_version) : sample.first_pipeline_run
    )

    if pipeline_run
      remove_host_filtering_urls = current_user.id != sample.user_id
      begin
        if pipeline_run.step_function?
          @results = PipelineVizDataServiceForSfn.call(pipeline_run.id, @show_experimental, remove_host_filtering_urls)
        elsif pipeline_run.directed_acyclic_graph?
          @results = RetrievePipelineVizGraphDataService.call(pipeline_run.id, @show_experimental, remove_host_filtering_urls)
        else
          not_found && return
        end
      rescue StandardError => e
        not_found(e) && (return)
      end

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
    else
      not_found && return
    end
  end

  def not_found(error = nil)
    if error
      Rails.logger.error(error.message)
    end
    render(json: {
             status: :not_found,
           }, status: :not_found)
  end
end
