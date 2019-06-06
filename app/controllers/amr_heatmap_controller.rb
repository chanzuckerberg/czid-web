class AmrHeatmapController < ApplicationController
  include ReportHelper

  before_action :admin_required

  current_power do # Put this here for CLI
    Power.new(current_user)
  end

  power :samples, as: :samples_scope

  before_action :set_sample

  # GET /amr_heatmap.json
  # Return JSON information required to create a visualization,
  # from submitted parameters
  # (for now do some hardcoded sampling)
  def index
    @pipeline_run = select_pipeline_run(@sample, params[:pipeline_version])
    @amr_counts = nil
    can_see_amr = (current_user.admin? || current_user.allowed_feature_list.include?("AMR"))
    if can_see_amr && @pipeline_run
      amr_state = @pipeline_run.output_states.find_by(output: "amr_counts")
      if amr_state.present? && amr_state.state == PipelineRun::STATUS_LOADED
        @amr_counts = @pipeline_run.amr_counts
      end
    end

    # We return AMR counts nested in an object containing the sample name and id
    @amr_data = {
      sample_name: @sample.name,
      sample_id: @sample.id,
      amr_counts: @amr_counts
    }

    render json: @amr_data
  end

  private

  def set_sample
    @sample = samples_scope.find(params[:id]) # general purpose
    assert_access
  end
end
