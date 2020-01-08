class SampleTypesController < ApplicationController
  # GET /sample_types.json
  def index
    @sample_types = SampleType.all

    respond_to do |format|
      format.json { render json: @sample_types }
    end
  end
end
