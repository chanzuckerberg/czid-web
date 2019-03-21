class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  clear_respond_to
  respond_to :json

  # GET /visualizations.json
  def index
    domain = params[:domain]

    # TODO: (gdingle): include samples? include projects?
    visualizations = if domain == "library"
                       current_user.visualizations
                     elsif domain == "public"
                       Visualization.where(public_access: 1)
                     else
                       Visualization.where("public_access = 1 OR user_id = ?", current_user.id)
                     end
    visualizations = visualizations
                     .joins(:user)
                     .select("visualizations.id AS id, user_id, visualizations.created_at, visualization_type, users.name AS user_name")
                     .where.not(visualization_type: [nil, 'undefined'])
                     .order(created_at: :desc)

    render json: visualizations
  end

  def visualization
    @type = params[:type]
    @visualization_data = {}

    if @type == "heatmap"
      @visualization_data = heatmap
    end

    id = params[:id]
    if id
      vis = Visualization.find(id)
      vis.data[:sampleIds] = vis.sample_ids
      @visualization_data[:savedParamValues] = vis.data
    end

    # Redirects until we support standalone visualizations for these types
    if @type == "table" || @type == "tree"
      sample_id = vis.sample_ids[0]
      return redirect_to "/samples/#{sample_id}?" + vis.data.to_query
    elsif @type == "phylo_tree"
      return redirect_to "/phylo_trees/index?" + vis.data.to_query
    end
  end

  # TODO: (gdingle): overwrite on save
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

  def shorten_url
    short_url = Shortener::ShortenedUrl.generate(params[:url])
    render json: {
      status: "success",
      message: "Url shortened successfully",
      unique_key: short_url.unique_key
    }
  rescue => err
    render json: {
      status: "failed",
      message: "Unable to shorten",
      errors: [err]
    }, status: :internal_server_error
  end
end
