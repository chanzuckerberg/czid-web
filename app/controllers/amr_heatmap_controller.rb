class AmrHeatmapController < ApplicationController
  before_action :admin_required

  # GET /amr_heatmap.json
  # Return JSON information about one or more samples' AMR counts, from submitted sample ids
  def amr_counts
    samples = current_power.viewable_samples.where(id: params[:sampleIds])
    good_sample_ids = {}
    amr_data = []

    samples.each do |sample|
      amr_counts = []
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
        amr_counts: amr_counts,
        error: ""
      }
      good_sample_ids[sample.id.to_s] = true
    end

    params[:sampleIds].each do |input_id|
      unless good_sample_ids.key?(input_id.to_s)
        amr_data << {
          sample_name: "",
          sample_id: input_id,
          amr_counts: [],
          error: "sample not found"
        }
      end
    end

    render json: amr_data
  end
end
