# This is a class of static helper methods for generating data for the heatmap
# visualization. See HeatmapElasticsearchHelperTest.
# See selectedOptions in SamplesHeatmapView for client-side defaults, and
# heatmap action in VisualizationsController.
class TopTaxonsElasticsearchService
  include Callable
  include ElasticsearchQueryHelper
  include HeatmapHelper

  # Based on the trade-off between performance and information quantity, we
  # decided on 10 as the best default number of taxons to show per sample.
  DEFAULT_MAX_NUM_TAXONS = 10
  DEFAULT_TAXON_SORT_PARAM = "highest_nt_rpm".freeze
  MINIMUM_READ_THRESHOLD = 1

  def initialize(
    params:,
    samples_for_heatmap:,
    background_for_heatmap:
  )
    @params = params
    @samples = samples_for_heatmap
    @should_remove_zscore = background_for_heatmap.nil?
    @background_id = background_for_heatmap || Rails.configuration.x.constants.default_background
  end

  def call
    return generate
  end

  # Samples and background are assumed here to be vieweable.
  def generate
    return {} if @samples.empty?

    filter_param = build_filter_param_hash

    pr_id_to_sample_id = HeatmapHelper.get_latest_pipeline_runs_for_samples(@samples)

    ElasticsearchQueryHelper.update_es_for_missing_data(
      filter_param[:background_id],
      pr_id_to_sample_id.keys
    )

    ElasticsearchQueryHelper.update_last_read_at(
      filter_param[:background_id],
      pr_id_to_sample_id.keys
    )

    results_by_pr = fetch_top_taxons(
      filter_param,
      pr_id_to_sample_id,
      filter_param[:addedTaxonIds]
    )
    dict = ElasticsearchQueryHelper.samples_taxons_details(
      results_by_pr,
      @samples,
      @should_remove_zscore
    )
    return dict
  end

  def build_filter_param_hash
    filter_params = {}
    filter_params[:min_reads] = @params[:minReads] ? @params[:minReads].to_i : MINIMUM_READ_THRESHOLD
    removed_taxon_ids = (@params[:removedTaxonIds] || []).map do |x|
      Integer(x)
    rescue ArgumentError
      nil
    end
    removed_taxon_ids = removed_taxon_ids.compact
    filter_params[:addedTaxonIds] = @params[:addedTaxonIds] || []
    taxon_ids = @params[:taxonIds] || []
    taxon_ids = taxon_ids.compact

    taxon_ids -= removed_taxon_ids
    filter_params[:taxon_ids] = taxon_ids
    threshold_filters = @params[:thresholdFilters]

    filter_params[:threshold_filters] = if threshold_filters.is_a?(Array)
                                          (threshold_filters || []).map { |filter| JSON.parse(filter || "{}") }
                                        else
                                          JSON.parse(threshold_filters || "[]")
                                        end

    filter_params[:background_id] = @background_id && @background_id > 0 ? @background_id : @samples.first.default_background_id

    if @params.include?("categories")
      filter_params[:categories] = @params[:categories]
    end
    if @params.include?("subcategories")
      subcategories = JSON.parse(@params[:subcategories])
      filter_params[:include_phage] = subcategories && subcategories["Viruses"] && subcategories["Viruses"].include?("Phage")
    end
    filter_params[:taxon_level] = @params[:species].to_i == TaxonCount::TAX_LEVEL_SPECIES ? TaxonCount::TAX_LEVEL_SPECIES : TaxonCount::TAX_LEVEL_GENUS
    if @params.include?("readSpecificity")
      filter_params[:read_specificity] = @params[:readSpecificity].to_i
    end
    filter_params[:sort_by] = @params[:sortBy] || DEFAULT_TAXON_SORT_PARAM
    filter_params[:taxons_per_sample] = @params[:taxonsPerSample] || DEFAULT_MAX_NUM_TAXONS
    filter_params[:taxon_tags] = @params[:taxonTags] || []

    # add the mandatory counts > 5 threshold filter to the `threshold_filters` to be later parsed by `elasticsearch_query_helper#parse_custom_filters`
    metric_count_type = filter_params[:sort_by].split("_")[1].upcase # TODO: I am extracting the metric details out of sort_by when they should probably be passed directly from the frontend
    filter_params[:threshold_filters] << \
      {
        "metric" => "#{metric_count_type}_r",
        "value" => filter_params[:min_reads],
        "operator" => ">=",
      }

    return filter_params
  end

  def fetch_top_taxons(
    filter_param,
    pr_id_to_sample_id,
    added_taxon_ids
  )
    # get the top 10 taxa for each sample
    top_n_taxa_per_sample = ElasticsearchQueryHelper.top_n_taxa_per_sample(
      filter_param,
      pr_id_to_sample_id.keys()
    )
    # for each sample, get the scores for each of the above taxa
    all_metrics_per_sample_and_taxa = ElasticsearchQueryHelper.all_metrics_per_sample_and_taxa(
      pr_id_to_sample_id.keys(),
      top_n_taxa_per_sample + added_taxon_ids,
      filter_param[:background_id]
    )
    # organizing the results by pipeline_run_id
    hash = ElasticsearchQueryHelper.organize_data_by_pr(all_metrics_per_sample_and_taxa, pr_id_to_sample_id)
    return hash
  end
end
