class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper

  # Endpoints made public for public ncov page.
  PUBLIC_NCOV_ENDPOINTS = [:index, :shorten_url, :visualization, :samples_taxons, :download_heatmap].freeze

  skip_before_action :authenticate_user!, only: PUBLIC_NCOV_ENDPOINTS

  # This action takes up to 10s for 50 samples so we cache it.
  caches_action(
    :samples_taxons,
    expires_in: 30.days,
    cache_path: proc do |c|
      sorted_params = c.request.params.to_h.sort.to_h
      if current_user.allowed_feature?("heatmap_filter_fe")
        sorted_params[:heatmap_filter_fe] = true
      end
      sorted_params.to_query
    end
  )

  # GET /visualizations.json
  def index
    domain = visualization_params[:domain]
    search = visualization_params[:search]

    visualizations = if domain == "my_data"
                       current_user.visualizations
                     elsif domain == "public"
                       Visualization.public
                     else
                       current_power.visualizations
                     end

    visualizations = visualizations
                     .joins(:user, :samples)
                     .select("DISTINCT visualizations.id AS id, users.id AS user_id, visualization_type, users.name AS user_name, visualizations.name, visualizations.updated_at") \
                     # filter out legacy data
                     .where.not(visualization_type: [nil, 'undefined'], name: nil)
                     .order(updated_at: :desc)
                     .includes(samples: [:project])
                     .db_search(search)

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
      sample_ids: vis.sample_ids,
    }
  rescue => err
    render json: {
      status: "failed",
      message: "Unable to save",
      errors: [err],
    }, status: :internal_server_error
  end

  def shorten_url
    short_url = Shortener::ShortenedUrl.generate(visualization_params[:url])
    render json: {
      status: "success",
      message: "Url shortened successfully",
      unique_key: short_url.unique_key,
    }
  rescue => err
    render json: {
      status: "failed",
      message: "Unable to shorten",
      errors: [err],
    }, status: :internal_server_error
  end

  # START OF HEATMAP METHODS

  def heatmap
    {
      taxonLevels: %w[Genus Species],
      categories: ReportHelper::ALL_CATEGORIES.pluck('name'),
      subcategories: {
        Viruses: ["Phage"],
      },
      metrics: HeatmapHelper::ALL_METRICS,
      backgrounds: current_power.backgrounds.map do |background|
        { name: background.name, value: background.id }
      end,
      thresholdFilters: {
        targets: [
          { text: "NT Z Score", value: "NT_zscore" },
          { text: "NT rPM", value: "NT_rpm" },
          { text: "NT r (total reads)", value: "NT_r" },
          { text: "NT %id", value: "NT_percentidentity" },
          { text: "NT L (alignment length in bp)", value: "NT_alignmentlength" },
          { text: "NT log(1/e)", value: "NT_neglogevalue" },
          { text: "NR Z Score", value: "NR_zscore" },
          { text: "NR r (total reads)", value: "NR_r" },
          { text: "NR rPM", value: "NR_rpm" },
          { text: "NR %id", value: "NR_percentidentity" },
          { text: "NR L (alignment length in bp)", value: "NR_alignmentlength" },
          { text: "R log(1/e)", value: "NR_neglogevalue" },
        ],
        operators: [">=", "<="],
      },
      allowedFeatures: current_user.allowed_feature_list,
      heatmapTs: heatmap_ts,
      prefilterConstants: {
        topN: HeatmapHelper::CLIENT_FILTERING_TAXA_PER_SAMPLE,
        minReads: HeatmapHelper::MINIMUM_READ_THRESHOLD,
      },
    }
  end

  def heatmap_metrics
    render json: HeatmapHelper::ALL_METRICS
  end

  def download_heatmap
    @sample_taxons_dict = HeatmapHelper.sample_taxons_dict(
      params,
      samples_for_heatmap,
      background_for_heatmap
    )
    output_csv = generate_heatmap_csv(@sample_taxons_dict)
    send_data output_csv, filename: 'heatmap.csv'
  end

  def samples_taxons
    @sample_taxons_dict = HeatmapHelper.sample_taxons_dict(
      params,
      samples_for_heatmap,
      background_for_heatmap,
      client_filtering_enabled: current_user.allowed_feature?("heatmap_filter_fe")
    )
    render json: @sample_taxons_dict
  end

  def update_heatmap_background
    @sample_taxons_dict = HeatmapHelper.update_background_taxon_metrics(
      params,
      samples_for_heatmap,
      background_for_heatmap,
      client_filtering_enabled: current_user.allowed_feature?("heatmap_filter_fe")
    )
    render json: @sample_taxons_dict
  end

  private

  def visualization_params
    params.permit(:domain, :type, :id, :url, :search, data: {})
  end

  def samples_for_heatmap
    id = visualization_params[:id]
    sample_ids = id ? Visualization.find(id).sample_ids : params[:sampleIds]
    current_power.samples
                 .where(id: sample_ids)
                 .includes([:host_genome, :pipeline_runs, metadata: [:metadata_field]])
  end

  def background_for_heatmap
    background_id = params["background"].to_i
    viewable_background_ids = current_power.backgrounds.pluck(:id)
    if viewable_background_ids.include?(background_id)
      return background_id
    end
  end

  # The most recent update time of all samples pipeline runs and metadata.
  def heatmap_ts
    pipeline_updated_ats = samples_for_heatmap
                           .map(&:first_pipeline_run)
                           .compact
                           .map(&:updated_at)
                           .compact
    metadata_updated_ats = samples_for_heatmap
                           .map(&:metadata)
                           .map { |ms| ms.map(&:updated_at) }
                           .flatten
    [pipeline_updated_ats.max, metadata_updated_ats.max].compact.max.to_i
  end
end
