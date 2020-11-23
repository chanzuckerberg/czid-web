class TaxonCountsHeatmapService
  # This service class returns compact results tailored for use in the heatmap.
  # Currently, it does not filter taxon counts based on client filters.
  # TODO: Support CSV output format (https://app.clubhouse.io/idseq/story/3304)
  # Possible TODOs: to be able to get a filtered version of multi sample data given constraints we need to implement server side filtering

  include Callable

  DEFAULT_MAX_NUM_TOP_TAXA_PER_SAMPLE = 1_000
  DEFAULT_MAX_TOTAL_TAXA = 10_000
  DEFAULT_MIN_READS = 0
  DEFAULT_COUNT_TYPES = [TaxonCount::COUNT_TYPE_NT, TaxonCount::COUNT_TYPE_NR].freeze

  def initialize(
    pipeline_run_ids:,
    background_id: nil,
    taxon_ids: nil,
    count_types: DEFAULT_COUNT_TYPES,
    min_reads: DEFAULT_MIN_READS,
    num_top_taxa_per_sample: DEFAULT_MAX_NUM_TOP_TAXA_PER_SAMPLE,
    ref_max_total_taxa: DEFAULT_MAX_TOTAL_TAXA
  )
    @pipeline_run_ids = pipeline_run_ids
    if background_id
      # make sure background exists
      Background.find(background_id)
    end
    @background_id = background_id
    @taxon_ids = taxon_ids

    @count_types = count_types
    @min_reads = min_reads
    @num_top_taxa_per_sample = num_top_taxa_per_sample
    @ref_max_total_taxa = ref_max_total_taxa
  end

  def call
    return generate
  end

  private

  def generate
    top_rank = nil
    if @taxon_ids.nil?
      # Step 1: determine the top n taxa for each sample, and value of n that limits number of taxa to ~= ref_max_total_taxa
      select_taxon_ids, top_rank = fetch_top_n_taxa_per_sample()
    else
      select_taxon_ids = @taxon_ids
    end

    # Step 2: get date for all pipeline runs and taxon ids
    taxon_counts = fetch_taxon_counts(select_taxon_ids)

    # Step 3: format results as expected by the heatmap frontend
    heatmap_results = format_results(taxon_counts)

    # Step 4: add metadata about the heatmap
    return {
      metadata: {}.tap do |md|
        if top_rank.present?
          md[:top_n_per_taxa] = top_rank
          md[:ref_total_taxa] = @ref_total_taxa
          md[:min_reads] = @min_reads
        end
        md[:background_id] = @background_id
      end,
    }.merge(heatmap_results)
  end

  def fetch_top_n_taxa_per_sample
    # Fetches top taxa per pipeline run per reads.
    # Returns a list of taxa ids that is in the top n of reads for at least one pipeline run.
    # The top n is determined by the minimum of `@num_top_taxa_per_sample` or the max n that leads to a total different taxon ids of `@ref_max_total_taxa`.

    # The first query of a session does not work - the session variable @pipeline_run_id_rank and @pipeline_run_id_rank_with_ties do not work, if we do not declare the variables before.
    # Although I could not find support on MySQL documentation, the first query seems to use always the undefined value instead of updating the variable.
    # Also guarantees that they are re-initialized to a value that avoids potential corner case issues from the last value from a previous query.
    ActiveRecord::Base.connection.execute("SET @current_pipeline_run_id := 0, @pipeline_run_id_rank := 0, @pipeline_run_id_rank_with_ties := 0, @current_count := 0")
    ranked_query = TaxonCount
                   .select(
                     :name,
                     :tax_id,
                     :genus_taxid,
                     :pipeline_run_id,
                     :count,
                     "@pipeline_run_id_rank := IF(@current_pipeline_run_id = pipeline_run_id, @pipeline_run_id_rank + 1, 1) AS pipeline_run_id_rank",
                     "@pipeline_run_id_rank_with_ties := IF(@current_pipeline_run_id = pipeline_run_id AND @current_count = count, @pipeline_run_id_rank_with_ties, @pipeline_run_id_rank) AS pipeline_run_id_rank_with_ties",
                     "@current_pipeline_run_id := pipeline_run_id AS current_pipeline_run_id",
                     "@current_count := count AS current_count"
                   )
                   .where(
                     pipeline_run_id: @pipeline_run_ids,
                     count_type: @count_types,
                     # Both species and genus count for the top N quota,
                     # Currently, the final (lower) top N is expected to be enforced on the client.
                     # Note: consider splitting into two requests. We might be losing important species for larger heatmaps,
                     #  since first spots of top N are taken by genus
                     tax_level: [TaxonCount::TAX_LEVEL_SPECIES, TaxonCount::TAX_LEVEL_GENUS]
                   )
                   .where("count >= ?", @min_reads)
                   .where.not(genus_taxid: [
                     TaxonLineage::BLACKLIST_GENUS_ID,
                     TaxonLineage::HOMO_SAPIENS_TAX_IDS,
                   ].flatten)
                   .order(:pipeline_run_id, count: :desc, tax_level: :asc)

    limited_ranked_query = TaxonCount
                           .select(:tax_id, :genus_taxid, :pipeline_run_id_rank_with_ties, :pipeline_run_id, :count)
                           .from(ranked_query)
                           .where("pipeline_run_id_rank_with_ties <= ?", @num_top_taxa_per_sample)
                           .group(:tax_id, :genus_taxid)
                           .order(minimum_pipeline_run_id_rank_with_ties: :asc)
                           .minimum(:pipeline_run_id_rank_with_ties)

    # Returns a list of taxon ids on top N for each pipeline
    # N is adjusted to the lowest value that surpasses the total max number of taxa
    top_rank = 0
    taxon_id_set = Set.new
    limited_ranked_query.each do |(tax_id, genus_tax_id), tax_id_min_rank|
      if taxon_id_set.length >= @ref_max_total_taxa && top_rank != tax_id_min_rank
        break
      end

      taxon_id_set.merge([tax_id, genus_tax_id])
      top_rank = tax_id_min_rank
    end
    return taxon_id_set, top_rank
  end

  def fetch_taxon_counts(taxon_ids)
    TaxonCountsDataService.call(
      pipeline_run_ids: @pipeline_run_ids,
      taxon_ids: taxon_ids,
      background_id: @background_id,
      include_lineage: true
    )
  end

  def format_results(taxon_counts)
    samples = samples_data()
    sample_id_by_pipeline_run_id = samples.map { |sample| [sample[:pipeline_run][:id], sample[:id]] }.to_h

    taxon_info = {}
    results = {}
    # translates metric name into frontend expected value (driven by the threshold filters)
    # TOOD: enforce single key name throughout the app
    results_key_map = {
      count: :r,
      rpm: :rpm,
      z_score: :zscore,
      percent_identity: :percentidentity,
      alignment_length: :alignmentlength,
      e_value: :logevalue,
      aggregate_score: :aggregatescore,
    }
    taxon_counts.each do |taxon_count|
      tax_id = taxon_count[:tax_id]
      pipeline_run_id = taxon_count[:pipeline_run_id]
      # show results indexed by sample ids and tax id
      sample_id = sample_id_by_pipeline_run_id[pipeline_run_id]

      if taxon_info[tax_id].blank?
        taxon_info[tax_id] = {}.tap do |h|
          h[:tax_id] = tax_id
          h[:name] = ReportsHelper.validate_name(
            tax_id: tax_id,
            tax_level: taxon_count[:tax_level],
            tax_name: taxon_count[:name],
            genus_tax_id: taxon_count[:genus_taxid],
            parent_name: TaxonCount::TAX_LEVEL_SPECIES ? taxon_count[:genus_name] : taxon_count[:family_name],
            pipeline_run_id: pipeline_run_id
          )[0] || taxon_count[:name]
          h[:common_name] = taxon_count[:common_name]
          h[:tax_level] = taxon_count[:tax_level]
          h[:genus_tax_id] = taxon_count[:genus_taxid]
          h[:genus_name] = taxon_count[:genus_name]
          h[:family_tax_id] = taxon_count[:family_taxid]
          h[:category_name] = TaxonLineage::CATEGORIES[taxon_count[:superkingdom_taxid]]
          h[:is_phage] = taxon_count[:is_phage]
        end
      end

      # Index by sample for backwards compatibility
      sample_results = (results[sample_id] ||= {})
      taxon_results = (sample_results[tax_id] ||= {})
      taxon_results[taxon_count[:count_type]] = results_key_map.keys.map do |key|
        taxon_count[key]
      end
    end

    return {
      samples: samples,
      taxa: taxon_info.values,
      result_keys: results_key_map.values,
      results: results,
    }
  end

  def samples_data
    # TODO: Due to sample metadata this leads to N+1 queries
    PipelineRun
      .includes(:sample)
      .where(id: @pipeline_run_ids)
      .map do |pr|
        {
          id: pr.sample_id,
          pipeline_run: {
            id: pr.id,
            pipeline_version: pr.pipeline_version,
            ercc_count: pr.total_ercc_reads,
          },
          name: pr.sample.name,
          metadata: pr.sample.metadata_with_base_type,
          host_genome_name: pr.sample.host_genome_name,
        }
      end
  end
end
