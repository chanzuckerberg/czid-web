class PipelineVizController < ApplicationController
  include PipelineOutputsHelper
  include StringUtil

  STATUS_NOT_FOUND = "Error: No pipeline run found matching requested version.".freeze
  STATUS_NO_EXECUTION_STRATEGY = "Error: No execution strategy found for pipeline run.".freeze
  STATUS_OTHER_ERROR = "Error: Unable to retrieve data for pipeline run.".freeze

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
      remove_host_filtering_urls = current_user.id != sample.user_id && !current_user.admin?
      begin
        if pipeline_run.step_function?
          @results = SfnPipelineDataService.call(pipeline_run.id, @show_experimental, remove_host_filtering_urls)
          # Give step names spaces between words and strip "out" from them
          @results[:stages].each { |stage| stage[:steps].each { |step| step[:name] = StringUtil.humanize_step_name(step[:name]) } }
        elsif pipeline_run.directed_acyclic_graph?
          @results = RetrievePipelineVizGraphDataService.call(pipeline_run.id, @show_experimental, remove_host_filtering_urls)
        else
          LogUtil.log_err_and_airbrake("Error retrieving data for pipeline viz: Pipeline Run #{pipeline_run.id} has no execution strategy")
          if current_user.admin?
            render(json: {
                     status: STATUS_NO_EXECUTION_STRATEGY,
                   }, status: :internal_server_error)
          else
            render(json: {
                     status: STATUS_OTHER_ERROR,
                   }, status: :internal_server_error)
          end
          return
        end
      rescue StandardError => e
        LogUtil.log_err_and_airbrake("Error retrieving pipeline viz data for Pipeline Run #{pipeline_run.id}: #{e}")
        if current_user.admin?
          render(json: {
                   status: STATUS_OTHER_ERROR,
                   error: e,
                 }, status: :internal_server_error)
        else
          render(json: {
                   status: STATUS_OTHER_ERROR,
                 }, status: :internal_server_error)
        end
        return
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
      render(json: {
               status: STATUS_NOT_FOUND,
             }, status: :not_found)
    end
  end
end
