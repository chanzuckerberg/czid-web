class AmrHeatmapController < ApplicationController
  before_action :admin_required

  def index
    @sample_ids = params[:sampleIds].map(&:to_i)
  end

  # GET /amr_heatmap/amr_heatmap.json
  # Return JSON information about one or more samples' AMR counts, from submitted sample ids
  # A samples amr_counts is an array of objects describing genes & alleles that code for
  # antimicrobial resistance. Each object in amr_counts will look like:
  # {
  #   "id": 99999,
  #   "gene": "GENE-1_Examp",
  #   "allele": "GENE-7_777",
  #   "coverage": 12.345,
  #   "depth": 0.987,
  #   "pipeline_run_id": 11111,
  #   "drug_family": "Dru",
  #   "created_at": "2019-01-01T01:01:01.000-01:00",
  #   "updated_at": "2019-01-01T01:01:01.000-01:00"
  # },

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
        sample_id: sample.id.to_i,
        amr_counts: amr_counts,
        error: ""
      }
      good_sample_ids[sample.id.to_i] = true
    end

    params[:sampleIds].each do |input_id|
      unless good_sample_ids.key?(input_id.to_i)
        amr_data << {
          sample_name: "",
          sample_id: input_id.to_i,
          amr_counts: [],
          error: "sample not found"
        }
      end
    end

    render json: amr_data
  end
end
