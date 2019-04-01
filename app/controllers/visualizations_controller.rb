class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  clear_respond_to
  respond_to :json

  # GET /visualizations.json
  def index
    domain = visualization_params[:domain]

    visualizations = if domain == "library"
                       current_user.visualizations
                     elsif domain == "public"
                       Visualization.where(public_access: 1)
                     else
                       Visualization.where("public_access = 1 OR user_id = ?", current_user.id)
                     end
    visualizations = visualizations
                     .joins(:user, :samples)
                     .select("DISTINCT visualizations.id AS id, users.id AS user_id, visualization_type, users.name AS user_name, visualizations.name, visualizations.updated_at") \
                     # filter out legacy data
                     .where.not(visualization_type: [nil, 'undefined'], name: nil)
                     .order(updated_at: :desc)
                     .includes(samples: [:project])

    render json: visualizations.as_json(
      methods: [:project_name, :samples_count]
    )
  end

  def visualization
    @type = visualization_params[:type]
    @visualization_data = {}

    if @type == "heatmap"
      @visualization_data = heatmap
    end

    id = visualization_params[:id]
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

  # This will create a new visualization object or overwite the most recent
  # existing one, based on the key of (user, type, sample_ids).
  # TODO: (gdingle): support forking by renaming
  def save
    @type = visualization_params[:type]
    @data = visualization_params[:data]

    sample_ids = @data[:sampleIds]
    # Delete to have single source of truth.
    @data.delete(:sampleIds)

    vis = Visualization.joins(:samples)
                       .where(
                         user: current_user,
                         visualization_type: @type,
                         samples: { id: [sample_ids] }
                       ) \
                       # filter out legacy data
                       .where.not(visualization_type: [nil, 'undefined'], name: nil)
                       .order(created_at: :desc)
                       .select { |v| v.sample_ids.to_set == sample_ids.to_set }
                       .first

    if vis.present?
      vis.data = @data
    else
      vis = Visualization.new(
        user: current_user,
        visualization_type: @type,
        sample_ids: sample_ids,
        data: @data,
        # Simply use the type as a placeholder.
        # TODO: (gdingle): support naming on first save and renaming
        name: @type.titleize
      )
    end
    vis.save!

    render json: {
      status: "success",
      message: "#{@type} saved successfully",
      type: @type,
      id: vis.id,
      data: @data,
      name: vis.name,
      sample_ids: vis.sample_ids
    }
  rescue => err
    render json: {
      status: "failed",
      message: "Unable to save",
      errors: [err]
    }, status: :internal_server_error
  end

  def shorten_url
    short_url = Shortener::ShortenedUrl.generate(visualization_params[:url])
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

  private

  def visualization_params
    params.permit(:domain, :type, :id, :url, data: {})
  end
end
