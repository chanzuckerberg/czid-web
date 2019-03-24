class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  clear_respond_to
  respond_to :json

  # GET /visualizations.json
  def index
    domain = params[:domain]

    visualizations = if domain == "library"
                       current_user.visualizations
                     elsif domain == "public"
                       Visualization.where(public_access: 1)
                     else
                       Visualization.where("public_access = 1 OR user_id = ?", current_user.id)
                     end
    visualizations = visualizations
                     .joins(:user)
                     .select("visualizations.id AS id, user_id, visualizations.created_at, visualization_type, users.name AS user_name, data")
                     .where.not(visualization_type: [nil, 'undefined'])
                     .order(created_at: :desc)
                     .includes(samples: [:project])

    render json: visualizations.as_json(
      methods: [:name, :project_name, :samples_count]
    )
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

    sample_ids = @data[:sampleIds]
    # Delete to have single source of truth.
    @data.delete(:sampleIds)

    vis = Visualization.new(
      user: current_user,
      visualization_type: @type,
      data: @data,
      sample_ids: sample_ids
    )
    if @type != "phylo_tree"
      vis.name = get_name(sample_ids)
    end
    vis.save!

    render json: {
      status: "success",
      message: "#{@type} saved successfully",
      type: @type,
      id: vis.id,
      data: @data,
      name: vis.name
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

  private

  def get_name(sample_ids)
    samples = Sample.where(id: sample_ids)
    if samples.length == 1
      samples[0].name
    elsif samples.length > 1
      names = samples.map(&:name)
      # make a string such as "Patient 016 (CSF) and 015 (CSF)"
      prefix = longest_common_prefix(names)
      if prefix.include?(' ')
        # Use whole words only
        # TODO: (gdingle): add other delimiters than space
        prefix = prefix.split(' ')[0..-2].join(' ')
      end
      names.each_with_index.map do |name, i|
        i > 0 ? name.delete_prefix(prefix) : name
      end.to_sentence
    else
      "unknown"
    end
  end

  # See https://rosettacode.org/wiki/Longest_common_prefix#Ruby
  def longest_common_prefix(strs)
    return "" if strs.empty?
    min, max = strs.minmax
    idx = min.size.times { |i| break i if min[i] != max[i] }
    min[0...idx]
  end
end
