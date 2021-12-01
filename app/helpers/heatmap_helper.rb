# This is a class of static helper methods for generating data for the heatmap
# visualization. See HeatmapHelperTest.
# See selectedOptions in SamplesHeatmapView for client-side defaults, and
# heatmap action in VisualizationsController.
module HeatmapHelper
  # Based on the trade-off between performance and information quantity, we
  # decided on 10 as the best default number of taxons to show per sample.
  DEFAULT_MAX_NUM_TAXONS = 10
  DEFAULT_TAXON_SORT_PARAM = 'highest_nt_rpm'.freeze
  READ_SPECIFICITY = true
  MINIMUM_READ_THRESHOLD = 5
  DEFAULT_NUM_RESULTS = 1_000_000

  # The number of taxa per sample to load
  # this should be high enough to compensate for any filters and thresholds
  #  that the user might use.
  # Note: [Feb 5 2020] At this moment, we set this at 1000 with no other reasoning
  # that being significantly higher (10x) than the maximum value for taxa per
  # sample (100)  that the user can select on the frontend interface.
  CLIENT_FILTERING_TAXA_PER_SAMPLE = 1000
  CLIENT_FILTERING_SORT_VALUES = { metric: "rpm", direction: "highest" }.freeze

  # Overfetch by a factor of 4 to allow for
  #   a) both count types, and
  #   b) any post-SQL filtering
  SERVER_FILTERING_OVERFETCH_FACTOR = 4

  ALL_METRICS = [
    { text: "NT rPM", value: "NT.rpm" },
    { text: "NT Z Score", value: "NT.zscore" },
    { text: "NT r (total reads)", value: "NT.r" },
    { text: "NR rPM", value: "NR.rpm" },
    { text: "NR Z Score", value: "NR.zscore" },
    { text: "NR r (total reads)", value: "NR.r" },
    { text: "NT %id", value: "NT.percentidentity" },
    { text: "NT L (alignment length in bp)", value: "NT.alignmentlength" },
    { text: "NT E Value", value: "NT.logevalue" },
    { text: "NR %id", value: "NR.percentidentity" },
    { text: "NR L (alignment length in bp)", value: "NR.alignmentlength" },
    { text: "NR E Value", value: "NR.logevalue" },
  ].freeze

  # Samples and background are assumed here to be vieweable.
  def self.sample_taxons_dict(params, samples, background_id)
    return {} if samples.empty?

    min_reads = params[:minReads] ? params[:minReads].to_i : MINIMUM_READ_THRESHOLD
    removed_taxon_ids = (params[:removedTaxonIds] || []).map do |x|
      Integer(x)
    rescue ArgumentError
      nil
    end
    removed_taxon_ids = removed_taxon_ids.compact
    threshold_filters = if params[:thresholdFilters].is_a?(Array)
                          (params[:thresholdFilters] || []).map { |filter| JSON.parse(filter || "{}") }
                        else
                          JSON.parse(params[:thresholdFilters] || "[]")
                        end

    sort_by = params[:sortBy] &&
              HeatmapHelper::ALL_METRICS.pluck(:value).include?(params[:sortBy]) ||
              HeatmapHelper::DEFAULT_TAXON_SORT_PARAM
    species_selected = params[:species] ? params[:species].to_i == 1 : false # Otherwise genus selected

    background_id = background_id && background_id > 0 ? background_id : samples.first.default_background_id

    # We only want to apply these filters on the backend if they are presets for the heatmap.
    # Otherwise, the backend will supply the unfiltered data, and the filters will be applied on the frontend.
    presets = params[:presets]
    categories = nil
    subcategories = nil
    include_phage = nil
    read_specificity = nil
    taxon_level = nil
    if presets
      if presets.include?("categories")
        categories = params[:categories]
      end
      if presets.include?("subcategories")
        subcategories = JSON.parse(params[:subcategories])
        include_phage = subcategories && subcategories["Viruses"] && subcategories["Viruses"].include?("Phage")
      end
      if presets.include?("species")
        taxon_level = params[:species].to_i == TaxonCount::TAX_LEVEL_SPECIES ? TaxonCount::TAX_LEVEL_SPECIES : TaxonCount::TAX_LEVEL_GENUS
      end
      if presets.include?("readSpecificity")
        read_specificity = params[:readSpecificity]
      end
    end

    results_by_pr = fetch_top_taxons(
      samples,
      background_id,
      categories: categories,
      include_phage: include_phage,
      read_specificity: read_specificity,
      taxon_level: taxon_level,
      min_reads: min_reads,
      threshold_filters: threshold_filters
    )

    details = top_taxons_details(results_by_pr, sort_by)
    taxon_ids = details.pluck('tax_id')
    taxon_ids -= removed_taxon_ids

    unless taxon_ids.empty?
      # Refetch at genus level using species level
      parent_ids = species_selected ? [] : details.pluck('genus_taxid').uniq
      results_by_pr = HeatmapHelper.fetch_samples_taxons_counts(samples, taxon_ids, parent_ids, background_id)
    end

    HeatmapHelper.samples_taxons_details(
      results_by_pr,
      samples,
      taxon_ids,
      threshold_filters
    )
  end

  def self.taxa_details(params, samples, background_id, update_background_only)
    taxon_ids = params[:taxonIds] || []
    taxon_ids = taxon_ids.compact

    removed_taxon_ids = params[:removedTaxonIds] || []
    removed_taxon_ids = removed_taxon_ids.compact

    taxon_ids -= removed_taxon_ids
    results_by_pr = HeatmapHelper.fetch_samples_taxons_counts(samples, taxon_ids, [], background_id, update_background_only: update_background_only)

    HeatmapHelper.samples_taxons_details(
      results_by_pr,
      samples,
      taxon_ids,
      []
    )
  end

  def self.top_taxons_details(results_by_pr, sort_by)
    sort = ReportHelper.decode_sort_by(sort_by)
    count_type = sort[:count_type]
    metric = sort[:metric]
    candidate_taxons = {}
    results_by_pr.each do |_pr_id, res|
      pr = res["pr"]
      taxon_counts = res["taxon_counts"]
      sample_id = pr.sample_id

      tax_2d = ReportHelper.taxon_counts_cleanup(taxon_counts)
      rows = []
      tax_2d.each do |_tax_id, tax_info|
        rows << tax_info
      end

      # NOTE: This block of code can probably be all removed because the same
      # filtering now happens earlier in SQL.
      HeatmapHelper.compute_aggregate_scores_v2!(rows)

      # Get the top N for each sample. This re-sorts on the same metric as in
      # fetch_top_taxons SQL. We sort there first for performance.
      rows.sort_by! { |tax_info| ((tax_info[count_type] || {})[metric] || 0.0) * -1.0 }
      count = 1
      rows.each do |row|
        taxon = candidate_taxons[row["tax_id"]] || { "tax_id" => row["tax_id"], "samples" => {}, "genus_taxid" => row["genus_taxid"] }
        taxon["max_aggregate_score"] = row[sort[:count_type]][sort[:metric]] if
          taxon["max_aggregate_score"].to_f < row[sort[:count_type]][sort[:metric]].to_f
        taxon["samples"][sample_id] = [count, row["tax_level"], row["NT"]["zscore"], row["NR"]["zscore"]]
        candidate_taxons[row["tax_id"]] = taxon
        count += 1
      end
    end

    candidate_taxons.values.sort_by { |taxon| -1.0 * taxon["max_aggregate_score"].to_f }
  end

  def self.fetch_top_taxons(
    samples,
    background_id,
    categories: [],
    include_phage: false,
    read_specificity: false,
    taxon_level: nil,
    min_reads: MINIMUM_READ_THRESHOLD,
    threshold_filters: []
  )
    categories_clause = ""
    if categories.present?
      categories_clause = " AND taxon_counts.superkingdom_taxid IN (#{categories.map { |category| ReportHelper::CATEGORIES_TAXID_BY_NAME[category] }.compact.join(',')})"
    elsif include_phage
      # if only the Phage subcategory and no other categories were selected, we still need to fetch Phage's parent category, Viruses
      categories_clause = " AND taxon_counts.superkingdom_taxid = #{ReportHelper::CATEGORIES_TAXID_BY_NAME['Viruses']}"
    end
    phage_clause = ""
    if !include_phage && categories.present?
      # explicitly filter out phages
      phage_clause = " AND taxon_counts.is_phage != 1"
    elsif include_phage && categories.blank?
      # only fetch phages
      phage_clause = " AND taxon_counts.is_phage = 1"
    end

    read_specificity_clause = ""
    if read_specificity
      read_specificity_clause = " AND taxon_counts.tax_id > 0"
    end

    tax_level_clause = " AND taxon_counts.tax_level IN ('#{TaxonCount::TAX_LEVEL_SPECIES}', '#{TaxonCount::TAX_LEVEL_GENUS}')"
    if taxon_level
      if taxon_level == TaxonCount::TAX_LEVEL_SPECIES
        tax_level_clause = " AND taxon_counts.tax_level IN ('#{TaxonCount::TAX_LEVEL_SPECIES}')"
      elsif taxon_level == TaxonCount::TAX_LEVEL_GENUS
        tax_level_clause = " AND taxon_counts.tax_level IN ('#{TaxonCount::TAX_LEVEL_GENUS}')"
      end
    end

    # fraction_subsampled was introduced 2018-03-30. For prior runs, we assume
    # fraction_subsampled = 1.0.
    # The total_ercc_reads can be nil, which we interpret as 0.
    rpm_sql = "count / (
          (total_reads - COALESCE(total_ercc_reads, 0)) *
          COALESCE(fraction_subsampled, 1.0)
        ) * 1000 * 1000"

    standard_z_score_sql = "(#{rpm_sql} - mean) / stdev"
    mass_normalized_zscore_sql = "((count/total_ercc_reads) - mean_mass_normalized) / stdev_mass_normalized"
    zscore_sql = "COALESCE(
        GREATEST(#{ReportHelper::ZSCORE_MIN}, LEAST(#{ReportHelper::ZSCORE_MAX},
          IF(mean_mass_normalized IS NULL, #{standard_z_score_sql}, #{mass_normalized_zscore_sql})
        )),
        #{ReportHelper::ZSCORE_WHEN_ABSENT_FROM_BACKGROUND})"

    pr_id_to_sample_id = HeatmapHelper.get_latest_pipeline_runs_for_samples(samples)

    query = "
    SELECT
      pipeline_run_id,
      taxon_counts.tax_id,
      taxon_counts.count_type,
      taxon_counts.tax_level,
      genus_taxid,
      family_taxid,
      taxon_counts.name,
      superkingdom_taxid,
      is_phage,
      count               AS  r,
      stdev,
      mean,
      stdev_mass_normalized,
      mean_mass_normalized,
      percent_identity    AS  percentidentity,
      alignment_length    AS  alignmentlength,
      COALESCE(e_value, #{ReportHelper::DEFAULT_SAMPLE_LOGEVALUE}) AS logevalue,
      -- First pass of ranking in SQL. Second pass in Ruby.
      #{rpm_sql} AS rpm,
      #{zscore_sql} AS zscore
    FROM taxon_counts
    LEFT OUTER JOIN pipeline_runs pr ON pipeline_run_id = pr.id
    LEFT OUTER JOIN taxon_summaries ON
      #{background_id.to_i}   = taxon_summaries.background_id   AND
      taxon_counts.count_type = taxon_summaries.count_type      AND
      taxon_counts.tax_level  = taxon_summaries.tax_level       AND
      taxon_counts.tax_id     = taxon_summaries.tax_id
    WHERE
      pipeline_run_id IN (#{pr_id_to_sample_id.keys.join(',')})
      AND genus_taxid != #{TaxonLineage::BLACKLIST_GENUS_ID}
      AND count >= #{min_reads}
      -- We need both types of counts for threshold filters
      AND taxon_counts.count_type IN ('NT', 'NR')
      #{tax_level_clause}
      #{categories_clause}
      #{phage_clause}
      #{read_specificity_clause}"

    sort = CLIENT_FILTERING_SORT_VALUES

    # TODO: (gdingle): how do we protect against SQL injection?
    # The first query of a session does not work - the session variable @rank do not work, if we do not declare the variables before.
    # Although I could not find support on MySQL documentation, the first query seems to use always the undefined value instead of updating the variable.
    # Also guarantees that they are re-initialized to a value that avoids potential corner case issues from the last value from a previous query.
    ActiveRecord::Base.connection.execute("SET @rank := 0, @current_id := 0;")
    sql_results = TaxonCount.connection.select_all(
      top_n_query(
        query,
        CLIENT_FILTERING_TAXA_PER_SAMPLE,
        sort[:metric],
        sort[:direction],
        threshold_filters: threshold_filters,
        count_type: sort[:count_type]
      )
    ).to_a

    # organizing the results by pipeline_run_id
    result_hash = {}

    pipeline_run_ids = sql_results.map { |x| x['pipeline_run_id'] }
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
        z_max = ReportHelper::ZSCORE_MAX
        z_min = ReportHelper::ZSCORE_MIN
        row["zscore"] = z_max if row["zscore"] > z_max &&
                                 row["zscore"] != ReportHelper::ZSCORE_WHEN_ABSENT_FROM_BACKGROUND
        row["zscore"] = z_min if row["zscore"] < z_min
        result_hash[pipeline_run_id]["taxon_counts"] << row
      end
    end
    result_hash
  end

  def self.samples_taxons_details(
    results_by_pr,
    samples,
    taxon_ids,
    threshold_filters
  )
    results = {}

    # Get sample results for the taxon ids
    unless taxon_ids.empty?
      samples_by_id = samples.index_by(&:id)
      results_by_pr.each do |_pr_id, res|
        pr = res["pr"]
        taxon_counts = res["taxon_counts"]
        sample_id = pr.sample_id
        tax_2d = ReportHelper.taxon_counts_cleanup(taxon_counts)

        rows = []
        tax_2d.each { |_tax_id, tax_info| rows << tax_info }
        HeatmapHelper.compute_aggregate_scores_v2!(rows)

        filtered_rows = rows
                        .select { |row| taxon_ids.include?(row["tax_id"]) }
                        .each { |row| row[:filtered] = HeatmapHelper.apply_custom_filters(row, threshold_filters) }

        results[sample_id] = {
          sample_id: sample_id,
          pipeline_version: pr.pipeline_version,
          name: samples_by_id[sample_id].name,
          metadata: samples_by_id[sample_id].metadata_with_base_type,
          host_genome_name: samples_by_id[sample_id].host_genome_name,
          taxons: filtered_rows,
          ercc_count: pr.total_ercc_reads,
        }
      end
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

  def self.fetch_samples_taxons_counts(samples, taxon_ids, parent_ids, background_id, update_background_only: false)
    parent_ids = parent_ids.to_a
    parent_ids_clause = parent_ids.empty? ? "" : " OR taxon_counts.tax_id in (#{parent_ids.join(',')}) "

    pr_id_to_sample_id = HeatmapHelper.get_latest_pipeline_runs_for_samples(samples)

    # Note: subsample_fraction is of type 'float' so adjusted_total_reads is too
    # Note: stdev is never 0
    # Note: connection.select_all is TWICE faster than TaxonCount.select
    # (I/O latency goes from 2 seconds -> 0.8 seconds)
    # Had to derive rpm and zscore for each sample
    sql_results =
      if update_background_only
        background_metrics_query(background_id, pr_id_to_sample_id, taxon_ids)
      else
        samples_taxons_counts_query(background_id, pr_id_to_sample_id, taxon_ids, parent_ids_clause)
      end

    # calculating rpm and zscore, organizing the results by pipeline_run_id
    result_hash = {}

    pipeline_run_ids = sql_results.map { |x| x['pipeline_run_id'] }
    pipeline_runs = PipelineRun.where(id: pipeline_run_ids.uniq).includes([:sample])
    pipeline_runs_by_id = pipeline_runs.index_by(&:id)

    sql_results.each do |row|
      pipeline_run_id = row["pipeline_run_id"]
      if result_hash[pipeline_run_id]
        pr = result_hash[pipeline_run_id]["pr"]
      else
        pr = pipeline_runs_by_id[pipeline_run_id]
        result_hash[pipeline_run_id] = { "pr" => pr, "taxon_counts" => [] }
      end
      if pr.total_reads
        z_max = ReportHelper::ZSCORE_MAX
        z_min = ReportHelper::ZSCORE_MIN
        z_default = ReportHelper::ZSCORE_WHEN_ABSENT_FROM_BACKGROUND
        row["rpm"] = pr.rpm(row["r"])
        row["zscore"] = if row["mean_mass_normalized"]
                          ((row["r"] / pr.total_ercc_reads.to_f) - row["mean_mass_normalized"]) / row["stdev_mass_normalized"]
                        else
                          row["stdev"].nil? ? z_default : ((row["rpm"] - row["mean"]) / row["stdev"])
                        end
        row["zscore"] = z_max if row["zscore"] > z_max && row["zscore"] != z_default
        row["zscore"] = z_min if row["zscore"] < z_min
        result_hash[pipeline_run_id]["taxon_counts"] << row
      end
    end

    result_hash
  end

  def self.samples_taxons_counts_query(background_id, pr_id_to_sample_id, taxon_ids, parent_ids_clause)
    TaxonCount.connection.select_all("
      SELECT
        taxon_counts.pipeline_run_id          AS  pipeline_run_id,
        taxon_counts.tax_id                   AS  tax_id,
        taxon_counts.count_type               AS  count_type,
        taxon_counts.tax_level                AS  tax_level,
        taxon_counts.genus_taxid              AS  genus_taxid,
        taxon_counts.family_taxid             AS  family_taxid,
        taxon_counts.name                     AS  name,
        taxon_lineages.genus_name             AS  genus_name,
        taxon_counts.superkingdom_taxid       AS  superkingdom_taxid,
        taxon_counts.is_phage                 AS  is_phage,
        taxon_counts.count                    AS  r,
        taxon_summaries.stdev                 AS  stdev,
        taxon_summaries.mean                  AS  mean,
        taxon_summaries.stdev_mass_normalized AS  stdev_mass_normalized,
        taxon_summaries.mean_mass_normalized  AS  mean_mass_normalized,
        taxon_counts.percent_identity         AS  percentidentity,
        taxon_counts.alignment_length         AS  alignmentlength,
        IF(
          taxon_counts.e_value IS NOT NULL,
          taxon_counts.e_value,
          #{ReportHelper::DEFAULT_SAMPLE_LOGEVALUE}
        )                                     AS  logevalue
      FROM taxon_counts
      JOIN taxon_lineages ON taxon_counts.tax_id = taxon_lineages.taxid
      LEFT OUTER JOIN taxon_summaries ON
        #{background_id.to_i}   = taxon_summaries.background_id   AND
        taxon_counts.count_type = taxon_summaries.count_type      AND
        taxon_counts.tax_level  = taxon_summaries.tax_level       AND
        taxon_counts.tax_id     = taxon_summaries.tax_id
      WHERE
        pipeline_run_id IN (#{pr_id_to_sample_id.keys.join(',')})
        AND taxon_counts.genus_taxid != #{TaxonLineage::BLACKLIST_GENUS_ID}
        AND taxon_counts.count_type IN ('NT', 'NR')
        AND (taxon_counts.tax_id IN (#{taxon_ids.join(',')})
        #{parent_ids_clause}
        OR taxon_counts.genus_taxid IN (#{taxon_ids.join(',')}))").to_a
  end

  def self.background_metrics_query(background_id, pr_id_to_sample_id, taxon_ids)
    # Only fetch metrics that are affected by the selected background.
    TaxonCount.connection.select_all("
      SELECT
        taxon_counts.pipeline_run_id          AS  pipeline_run_id,
        taxon_counts.tax_id                   AS  tax_id,
        taxon_counts.count_type               AS  count_type,
        taxon_counts.tax_level                AS  tax_level,
        taxon_counts.count                    AS  r,
        taxon_summaries.stdev_mass_normalized AS  stdev_mass_normalized,
        taxon_summaries.mean_mass_normalized  AS  mean_mass_normalized,
        taxon_summaries.stdev                 AS  stdev,
        taxon_summaries.mean                  AS  mean
      FROM taxon_counts
      LEFT OUTER JOIN taxon_summaries ON
        #{background_id.to_i}   = taxon_summaries.background_id   AND
        taxon_counts.count_type = taxon_summaries.count_type      AND
        taxon_counts.tax_level  = taxon_summaries.tax_level       AND
        taxon_counts.tax_id     = taxon_summaries.tax_id
      WHERE
        pipeline_run_id IN (#{pr_id_to_sample_id.keys.join(',')})
        AND taxon_counts.genus_taxid != #{TaxonLineage::BLACKLIST_GENUS_ID}
        AND taxon_counts.count_type IN ('NT', 'NR')
        AND (taxon_counts.tax_id IN (#{taxon_ids.join(',')}))").to_a
  end

  def self.compute_aggregate_scores_v2!(rows)
    rows.each do |taxon_info|
      # NT and NR zscore are set to the same
      taxon_info['NT']['maxzscore'] = [taxon_info['NT']['zscore'], taxon_info['NR']['zscore']].max
      taxon_info['NR']['maxzscore'] = taxon_info['NT']['maxzscore']
    end
  end

  def self.parse_custom_filters(threshold_filters)
    parsed = []
    threshold_filters.each do |filter|
      count_type, metric = filter["metric"].split("_")
      begin
        value = Float(filter["value"])
      rescue StandardError
        Rails.logger.warn "Bad threshold filter value."
      else
        parsed << {
          count_type: count_type,
          metric: metric,
          value: value,
          operator: filter["operator"],
        }
      end
    end
    parsed
  end

  def self.apply_custom_filters(row, threshold_filters)
    parsed = HeatmapHelper.parse_custom_filters(threshold_filters)
    parsed.each do |filter|
      if filter[:operator] == ">="
        if row[filter[:count_type]][filter[:metric]] < filter[:value]
          return false
        end
      elsif row[filter[:count_type]][filter[:metric]] > filter[:value]
        return false
      end
    end
    true
  end

  def self.only_species_level_counts!(taxon_counts_2d)
    taxon_counts_2d.keep_if { |_tax_id, tax_info| tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES }
  end

  # This query:
  # 1) assigns a rank to each row within a pipeline run
  # 2) returns rows ranking <= num_results
  # See http://www.sqlines.com/mysql/how-to/get_top_n_each_group
  def self.top_n_query(
    query,
    num_results,
    sort_field,
    sort_direction,
    threshold_filters: nil,
    count_type: nil
  )
    if threshold_filters.present?
      # custom filters are applied at the taxon level, not the count level,
      # so we need rank entirely in ruby.
      return query
    end

    count_type_order_clause = count_type.present? ? "count_type = '#{count_type}' DESC," : ""

    "SELECT *
      FROM (
        SELECT
          @rank := IF(@current_id = pipeline_run_id, @rank + 1, 1) AS rank,
          @current_id := pipeline_run_id AS current_id,
          a.*
        FROM (
          #{query}
        ) a
        ORDER BY
          pipeline_run_id,
          #{count_type_order_clause}
          #{sort_field} #{sort_direction == 'highest' ? 'DESC' : 'ASC'}
      ) b
      WHERE rank <= #{num_results}
    "
  end

  # NOTE: This was extracted from a subquery because mysql was not using the
  # the resulting IDs for an indexed query.
  # Return a map of pipeline run id to sample id.
  def self.get_latest_pipeline_runs_for_samples(samples)
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
