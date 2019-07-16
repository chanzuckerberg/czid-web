class PipelineVizController < ApplicationController
  before_action :authenticate_user!

  # Structures dag_json of each stage of the pipeline run into the following for drawing
  # the pipeline visualization graphs on the React side:
  # @stages: An array of stages, each stage being an object with the following fields:
  #     - jobStatus: The job status of the stage
  #     - steps: Array of objects, each one defining a node in that stage's graph. This object
  #       is composed of:
  #           - stepName: The name to be displayed for this step
  #               - inputEdges: An array of indices that map to edges in the @edges array (see below), each
  #                 edge being an input edge to the node.
  #               - ouputEdges: An array of indices that map to edges in the @edges array, each edge being an
  #                 output edge from the node
  #
  # @edges: An array of edges, each edge object having the following structure:
  #     - from: An object containing a stageIndex and stepIndex, denoting the originating node it is from
  #     - to: An object containing a stageIndex and stepIndex, denoating the node it ends after
  #     - files: An array of files that get passed between the from and to nodes. Currently each file is a string,
  #       but it may become an object containing download url and potentially other information.

  # GET /sample/:sample_id/pipeline_viz/:pipeline_version
  # GET /sample/:sample_id/pipeline_viz/:pipeline_version.json
  def show
    feature_allowed = current_user.allowed_feature_list.include?("pipeline_viz")
    sample = current_power.samples.find_by(id: params[:sample_id])
    pipeline_version = params[:pipeline_version]
    pipeline_run_id = sample && (
      pipeline_version ? sample.pipeline_runs.where(pipeline_version: pipeline_version)[0] : sample.first_pipeline_run
    ).id

    if feature_allowed && pipeline_run_id
      @results = RetrievePipelineVizGraphDataService.call(pipeline_run_id, current_user.admin?)

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
