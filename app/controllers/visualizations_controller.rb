class VisualizationsController < ApplicationController
  include ReportHelper
  include HeatmapHelper
  include ParameterSanitization

  # This action takes up to 10s for 50 samples so we cache it.
  caches_action(
    :samples_taxons,
    expires_in: 30.days,
    cache_path: proc do |c|
      sorted_params = c.request.params.to_h.sort.to_h
      ["heatmap_service", "heatmap_elasticsearch"].each do |feature|
        if current_user.allowed_feature?(feature)
          sorted_params[feature.to_sym] = true
        end
      end
      sorted_params.to_query
    end
  )

  # GET /visualizations.json
  def index
    domain = visualization_params[:domain]
    search = visualization_params[:search]

    sorting_v0_allowed = current_user.allowed_feature?("sorting_v0_admin") || (current_user.allowed_feature?("sorting_v0") && domain == "my_data")

    order_by = if sorting_v0_allowed
                 visualization_params[:orderBy] || "updated_at"
               else
                 :updated_at
               end
    order_dir = sanitize_order_dir(visualization_params[:orderDir], :desc)

    visualizations = if domain == "my_data"
                       current_user.visualizations
                     elsif domain == "public"
                       Visualization.public
                     else
                       current_power.visualizations
                     end

    # TODO: this is a temporary quick fix to filter out deprecated PhyloTreeNgs, but will
    # not scale as the number of PhyloTreeNgs increase.
    # We have a ticket to rework the Visualizations model to address this.
    deprecated_phylo_tree_ngs = PhyloTreeNg.where(deprecated: true).ids
    deprecated_visualizations_data = deprecated_phylo_tree_ngs.map { |id| { "treeNgId" => id } }

    visualizations = visualizations
                     .joins(:user, :samples)
                     .select("DISTINCT visualizations.id AS id, users.id AS user_id, visualization_type, users.name AS user_name, visualizations.name, visualizations.updated_at, visualizations.status") \
                     .where.not(data: deprecated_visualizations_data) # filter out deprecated PhyloTreeNgs
                     .where.not(visualization_type: [nil, 'undefined'], name: nil) # filter out legacy data

    visualizations = if sorting_v0_allowed
                       Visualization.sort_visualizations(visualizations, order_by, order_dir)
                     else
                       visualizations.order(updated_at: :desc)
                     end

    visualizations = visualizations
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
      vis = current_power.visualizations.find(id)
      vis.data[:sampleIds] = vis.sample_ids
      vis.data[:id] = id
      @visualization_data[:savedParamValues] = vis.data
      @visualization_data[:name] = vis.name
    end

    # Redirects until we support standalone visualizations for these types
    if @type == "table" || @type == "tree"
      sample_id = vis.sample_ids[0]
      return redirect_to "/samples/#{sample_id}?" + vis.data.to_query
    elsif @type == "phylo_tree"
      return redirect_to "/phylo_trees/index?" + vis.data.to_query
    elsif @type == "phylo_tree_ng"
      tree_id = vis.data["treeNgId"]
      return redirect_to "/phylo_tree_ngs/#{tree_id}?" + vis.data.to_query
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
                       .find { |v| v.sample_ids.to_set == sample_ids.to_set }

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
  rescue StandardError => err
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
  rescue StandardError => err
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
        { name: background.name, value: background.id, mass_normalized: background.mass_normalized }
      end,
      thresholdFilters: {
        targets: [
          { text: "NT Z Score", value: "NT_zscore" },
          { text: "NT rPM", value: "NT_rpm" },
          { text: "NT r (total reads)", value: "NT_r" },
          { text: "NT %id", value: "NT_percentidentity" },
          { text: "NT L (alignment length in bp)", value: "NT_alignmentlength" },
          { text: "NT E Value (as a power of 10)", value: "NT_logevalue" },
          { text: "NR Z Score", value: "NR_zscore" },
          { text: "NR r (total reads)", value: "NR_r" },
          { text: "NR rPM", value: "NR_rpm" },
          { text: "NR %id", value: "NR_percentidentity" },
          { text: "NR L (alignment length in bp)", value: "NR_alignmentlength" },
          { text: "NR E Value (as a power of 10)", value: "NR_logevalue" },
        ],
        operators: [">=", "<="],
      },
      allowedFeatures: current_user.allowed_feature_list,
      heatmapTs: heatmap_ts,
      prefilterConstants: {
        topN: HeatmapHelper::CLIENT_FILTERING_TAXA_PER_SAMPLE,
        minReads: HeatmapHelper::MINIMUM_READ_THRESHOLD,
      },
      projectIds: samples_for_heatmap.map(&:project_id),
    }
  end

  def heatmap_metrics
    render json: HeatmapHelper::ALL_METRICS
  end

  def download_heatmap
    if current_user.allowed_feature?("heatmap_elasticsearch")
      heatmap_es_dict = TopTaxonsElasticsearchService.call(
        params: params,
        samples_for_heatmap: samples_for_heatmap,
        background_for_heatmap: background_for_heatmap
      )
      output_csv = generate_heatmap_csv(heatmap_es_dict)
    else
      @sample_taxons_dict = HeatmapHelper.sample_taxons_dict(
        params,
        samples_for_heatmap,
        background_for_heatmap
      )
      output_csv = generate_heatmap_csv(@sample_taxons_dict)
    end
    send_data output_csv, filename: 'heatmap.csv'
  end

  def samples_taxons
    if samples_for_heatmap.blank?
      render json: {}
    elsif current_user.allowed_feature?("heatmap_service") && params[:presets].blank?
      pr_id_to_sample_id = HeatmapHelper.get_latest_pipeline_runs_for_samples(samples_for_heatmap)
      heatmap_dict = TaxonCountsHeatmapService.call(
        pipeline_run_ids: pr_id_to_sample_id.keys,
        background_id: background_for_heatmap
      )
      render json: heatmap_dict
    elsif current_user.allowed_feature?("heatmap_elasticsearch")
      heatmap_es_dict = TopTaxonsElasticsearchService.call(
        params: params,
        samples_for_heatmap: samples_for_heatmap,
        background_for_heatmap: background_for_heatmap
      )
      render json: heatmap_es_dict
    else
      @sample_taxons_dict = HeatmapHelper.sample_taxons_dict(
        params,
        samples_for_heatmap,
        background_for_heatmap
      )
      render json: @sample_taxons_dict
    end
  end

  # Given a list of taxon ids, samples, and a background, returns the
  # details for the specified taxa.
  # If update_background_only is true, then returned object will only include
  # metrics affected by the background (e.g. z-score).
  def taxa_details
    if current_user.allowed_feature?("heatmap_service") && params[:presets].blank?
      pr_id_to_sample_id = HeatmapHelper.get_latest_pipeline_runs_for_samples(samples_for_heatmap)
      taxon_ids = params[:taxonIds] || []

      sample_taxons_dict = TaxonCountsHeatmapService.call(
        pipeline_run_ids: pr_id_to_sample_id.keys,
        taxon_ids: taxon_ids.compact,
        background_id: background_for_heatmap
      )
    elsif current_user.allowed_feature?("heatmap_elasticsearch")
      pr_id_to_sample_id = HeatmapHelper.get_latest_pipeline_runs_for_samples(samples_for_heatmap)
      taxon_ids = params[:taxonIds] || []

      sample_taxons_dict = TaxonDetailsElasticsearchService.call(
        pr_id_to_sample_id: pr_id_to_sample_id,
        samples: samples_for_heatmap,
        taxon_ids: taxon_ids.compact,
        background_id: background_for_heatmap
      )
    else
      update_background_only = params[:updateBackgroundOnly]
      sample_taxons_dict = HeatmapHelper.taxa_details(
        params,
        samples_for_heatmap,
        background_for_heatmap,
        update_background_only
      )
    end

    render json: sample_taxons_dict
  end

  # PATCH/PUT /visualizations/1
  # PATCH/PUT /visualizations/1.json
  def update
    id = visualization_params[:id]
    name = visualization_params[:name]

    if Visualization.find(id).update(name: name)
      render json: { id: id, name: name }, status: :ok
    else
      render json: { error: @visualization.errors.full_messages }, status: :internal_server_error
    end
  end

  private

  def visualization_params
    params.permit(:domain, :visualization, :name, :type, :id, :url, :search, :orderBy, :orderDir, data: {})
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
