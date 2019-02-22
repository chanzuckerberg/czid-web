class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  clear_respond_to
  respond_to :json

  # GET /visualizations.json
  def index
    only_library = ActiveModel::Type::Boolean.new.cast(params[:onlyLibrary])
    exclude_library = ActiveModel::Type::Boolean.new.cast(params[:excludeLibrary])

    # TODO: (gdingle): include samples? include projects?
    if only_library
      visualizations = current_user.visualizations
    elsif exclude_library
      visualizations = Visualization
                       .where(public_access: 1)
    # TODO: See https://jira.czi.team/browse/IDSEQ-866
    # .where.not(user: current_user)
    else
      raise 'Visualizations must be for either "my library" or "public"'
    end
    # TODO: (gdingle): update the table React
    visualizations = visualizations.joins(:user)
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

    # TODO: (gdingle): redirect to report with url params

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
