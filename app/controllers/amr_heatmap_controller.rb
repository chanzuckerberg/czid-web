class AmrHeatmapController < ApplicationController
  include ReportHelper

  before_action :admin_required

  power :viewable_samples

  # GET /amr_heatmap.json
  # Return JSON information required to create a visualization,
  # from submitted parameters
  def amr_counts
    samples = []
    amr_data = []

    params[:id].each do |param_id|
      sample = current_power.viewable_samples.find(param_id)
      assert_access
      samples << sample
    end

    samples.each do |sample|
      amr_counts = nil
      pipeline_run = sample.first_pipeline_run
      if pipeline_run
        amr_state = pipeline_run.output_states.find_by(output: "amr_counts")
        if amr_state.present? && amr_state.state == PipelineRun::STATUS_LOADED
          amr_counts = pipeline_run.amr_counts
        end
      end
      amr_data << {
        sample_name: sample.name,
        sample_id: sample.id,
        amr_counts: amr_counts
      }
    end

    render json: amr_data
  end
end
