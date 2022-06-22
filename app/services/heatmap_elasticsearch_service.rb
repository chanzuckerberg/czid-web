# This is a class of static helper methods for generating data for the heatmap
# visualization. See HeatmapElasticsearchHelperTest.
# See selectedOptions in SamplesHeatmapView for client-side defaults, and
# heatmap action in VisualizationsController.
class HeatmapElasticsearchService
  include Callable
  include ElasticsearchQueryHelper

  # Based on the trade-off between performance and information quantity, we
  # decided on 10 as the best default number of taxons to show per sample.
  DEFAULT_MAX_NUM_TAXONS = 10
  DEFAULT_TAXON_SORT_PARAM = "highest_nt_rpm".freeze
  MINIMUM_READ_THRESHOLD = 5

  def initialize(
    params:,
    samples_for_heatmap:,
    background_for_heatmap:
  )
    @params = params
    @samples = samples_for_heatmap
    @background_id = background_for_heatmap
  end

  def call
    return generate
  end

  private

  # Samples and background are assumed here to be vieweable.
  def generate
    return {} if @samples.empty?

    filter_param = build_filter_param_hash

    pr_id_to_sample_id = get_latest_pipeline_runs_for_samples(@samples)

    ElasticsearchQueryHelper.update_es_for_missing_data(
      filter_param[:background_id],
      pr_id_to_sample_id.keys
    )
    results_by_pr = fetch_top_taxons(
      filter_param,
      pr_id_to_sample_id
    )
    dict = samples_taxons_details(
      results_by_pr,
      @samples
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

    filter_params[:background_id] = @background_id && @background_id > 0 ? @background_id : samples.first.default_background_id

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
    pr_id_to_sample_id
  )
    # get the top 10 taxa for each sample
    top_n_taxa_per_sample = ElasticsearchQueryHelper.top_n_taxa_per_sample(
      filter_param,
      pr_id_to_sample_id.keys()
    )

    # for each sample, get the scores for each of the above taxa
    all_metrics_per_sample_and_taxa = ElasticsearchQueryHelper.all_metrics_per_sample_and_taxa(
      filter_param,
      pr_id_to_sample_id.keys(),
      top_n_taxa_per_sample
    )
    # organizing the results by pipeline_run_id
    hash = organize_data_by_pr(all_metrics_per_sample_and_taxa, pr_id_to_sample_id)
    return hash
  end

  def organize_data_by_pr(sql_results, pr_id_to_sample_id)
    # organizing taxons by pipeline_run_id
    result_hash = {}

    pipeline_run_ids = sql_results.map { |x| x["pipeline_run_id"] }
    pipeline_runs = PipelineRun.where(id: pipeline_run_ids.uniq).includes([:sample])
    pipeline_runs_by_id = pipeline_runs.index_by(&:id)
    sql_results.each do |row|
      pipeline_run_id = row["pipeline_run_id"]
      if result_hash[pipeline_run_id]
        pr = result_hash[pipeline_run_id]["pr"]
      else
        pr = pipeline_runs_by_id[pipeline_run_id]
        result_hash[pipeline_run_id] = {
          "pr" => pr,
          "taxon_counts" => [],
          "sample_id" => pr_id_to_sample_id[pipeline_run_id],
        }
      end
      if pr.total_reads
        result_hash[pipeline_run_id]["taxon_counts"] << row
      end
    end
    return result_hash
  end

  def samples_taxons_details(
    results_by_pr,
    samples
  )
    results = {}

    # Get sample results for the taxon ids
    samples_by_id = samples.index_by(&:id)
    results_by_pr.each do |_pr_id, res|
      pr = res["pr"]
      taxon_counts = res["taxon_counts"]
      sample_id = pr.sample_id
      tax_2d = ReportHelper.taxon_counts_cleanup(taxon_counts)

      rows = []
      tax_2d.each { |_tax_id, tax_info| rows << tax_info }
      compute_aggregate_scores_v2!(rows)

      results[sample_id] = {
        sample_id: sample_id,
        pipeline_version: pr.pipeline_version,
        name: samples_by_id[sample_id].name,
        metadata: samples_by_id[sample_id].metadata_with_base_type,
        host_genome_name: samples_by_id[sample_id].host_genome_name,
        taxons: rows,
        ercc_count: pr.total_ercc_reads,
      }
    end

    # For samples that didn't have matching taxons, just throw in the metadata.
    samples.each do |sample|
      unless results.key?(sample.id)
        results[sample.id] = {
          sample_id: sample.id,
          name: sample.name,
          metadata: sample.metadata_with_base_type,
          host_genome_name: sample.host_genome_name,
          ercc_count: 0,
        }
      end
    end
    # Flatten the hash
    results.values
  end

  def compute_aggregate_scores_v2!(rows)
    rows.each do |taxon_info|
      # NT and NR zscore are set to the same
      taxon_info["NT"]["maxzscore"] = [taxon_info["NT"]["zscore"], taxon_info["NR"]["zscore"]].max
      taxon_info["NR"]["maxzscore"] = taxon_info["NT"]["maxzscore"]
    end
  end

  # NOTE: This was extracted from a subquery because mysql was not using the
  # the resulting IDs for an indexed query.
  # Return a map of pipeline run id to sample id.
  def get_latest_pipeline_runs_for_samples(samples)
    # not the ideal way to get the current pipeline but it is consistent with
    # current logic elsewhere.
    TaxonCount.connection.select_all(
      "SELECT MAX(id) AS id, sample_id
        FROM pipeline_runs
        WHERE sample_id IN (#{samples.pluck(:id).to_set.to_a.join(',')})
        GROUP BY sample_id"
    )
              .map { |r| [r["id"], r["sample_id"]] }
              .to_h
  end
end
