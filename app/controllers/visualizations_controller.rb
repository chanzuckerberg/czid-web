class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  def visualization
    @type = params[:type]

    if @type == "heatmap"
      @visualization_data = heatmap
    end

    id = params[:id]
    if id
      vis = Visualization.find(id)
      vis.data[:sampleIds] = vis.sample_ids
      @visualization_data[:savedParamValues] = vis.data
    end
    # TODO: (gdingle): collection list view?
  end

  def save
    @type = params[:type]
    @data = params[:data]
    vis = Visualization.create(
      user: current_user,
      visualization_type: @type,
      data: @data
    )
    vis.sample_ids = @data[:sampleIds]
    # Delete to have single source of truth.
    @data.delete(:sampleIds)

    render json: {
      status: "success",
      message: "#{@type} saved successfully",
      type: @type,
      id: vis.id,
      data: @data
    }
  rescue => err
    render json: {
      status: "failed",
      message: "Unable to save #{@type}",
      errors: [err]
      # TODO: (gdingle): better error code?
    }, status: :internal_server_error
  end
end
