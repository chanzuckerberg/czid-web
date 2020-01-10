class SampleTypesController < ApplicationController
  # GET /sample_types.json
  def index
    respond_to do |format|
      format.json { render json: SampleType.all }
    end
  end
end
