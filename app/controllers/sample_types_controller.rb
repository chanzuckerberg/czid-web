class SampleTypesController < ApplicationController
  # Endpoints made public for public ncov page.
  PUBLIC_NCOV_ENDPOINTS = [:index].freeze

  skip_before_action :authenticate_user!, only: PUBLIC_NCOV_ENDPOINTS

  # GET /sample_types.json
  def index
    respond_to do |format|
      format.json { render json: SampleType.all }
    end
  end
end
