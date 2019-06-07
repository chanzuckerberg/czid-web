class HeatmapController < ApplicationController
  def index
    # TODO(tiago): sanitized parameters
    sample_ids = params[:sampleIds]
    render json: sample_ids
  end
end
