class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  def visualization
    # TODO: (gdingle): refactor off of heatmap
    @heatmap_data = heatmap

    id = params[:id]
    if id
      vis = Visualization.find(id)

      # TODO: (gdingle): does this makes sense for non-heatmap?
      sample_ids = vis.data['sampleIds']
      if vis.visualization_type == "heatmap" && sample_ids != vis.sample_ids
        raise "Sample IDs do not match: #{sample_ids}, #{vis.sample_ids}"
      end

      @heatmap_data[:savedParamValues] = vis.data
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
