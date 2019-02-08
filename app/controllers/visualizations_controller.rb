class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  def visualization
    # TODO: (gdingle): dispatch by type
    # type = params[:type]

    @heatmap_data = heatmap

    id = params[:id]
    if id
      vis = Visualization.find(id)
      @heatmap_data[:savedParamValues] = vis.data
    end
    # TODO: (gdingle): list view?
  end
end
