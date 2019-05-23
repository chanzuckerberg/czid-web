module HeatmapHelper
  DEFAULT_MAX_NUM_TAXONS = 30

  MINIMUM_READ_THRESHOLD = 5
  MINIMUM_ZSCORE_THRESHOLD = 1.7

  # All the methods below should be considered private, but I don't know enough
  # about ruby to actually make a class method private and call it.
  # private

  def self.sample_taxons_dict(params, samples)
    return {} if samples.empty?

    num_results = params[:taxonsPerSample] ? params[:taxonsPerSample].to_i : DEFAULT_MAX_NUM_TAXONS
    removed_taxon_ids = (params[:removedTaxonIds] || []).map do |x|
      begin
        Integer(x)
      rescue ArgumentError
        nil
      end
    end
    removed_taxon_ids = removed_taxon_ids.compact
    categories = params[:categories]
    threshold_filters = if params[:thresholdFilters].is_a?(Array)
                          (params[:thresholdFilters] || []).map { |filter| JSON.parse(filter || "{}") }
                        else
                          JSON.parse(params[:thresholdFilters] || "[]")
                        end
    subcategories = if params[:subcategories] && params[:subcategories].respond_to?(:to_h)
                      params[:subcategories].permit!.to_h
                    else
                      JSON.parse(params[:subcategories] || "{}")
                    end
    include_phage = subcategories.fetch("Viruses", []).include?("Phage")
    read_specificity = params[:readSpecificity] ? params[:readSpecificity].to_i == 1 : false

    # TODO: should fail if field is not well formatted and return proper error to client
    sort_by = params[:sortBy] || ReportHelper::DEFAULT_TAXON_SORT_PARAM
    species_selected = params[:species] == "1" # Otherwise genus selected

    first_sample = samples.first
    background_id = params[:background] ? params[:background].to_i : get_background_id(first_sample)

    taxon_ids = HeatmapHelper.top_taxons_details(samples, background_id, num_results, sort_by, species_selected, categories, threshold_filters, read_specificity, include_phage).pluck("tax_id")
    taxon_ids -= removed_taxon_ids

    HeatmapHelper.samples_taxons_details(samples, taxon_ids, background_id, species_selected, threshold_filters)
  end

  def self.top_taxons_details(samples, background_id, num_results, sort_by_key, species_selected, categories, threshold_filters = {}, read_specificity = false, include_phage = false)
    # return top taxons
    results_by_pr = fetch_top_taxons(samples, background_id, categories, read_specificity, include_phage, num_results)

    sort_by = ReportHelper.decode_sort_by(sort_by_key)
    count_type = sort_by[:count_type]
    metric = sort_by[:metric]
    candidate_taxons = {}
    results_by_pr.each do |_pr_id, res|
      pr = res["pr"]
      taxon_counts = res["taxon_counts"]
      sample_id = pr.sample_id

      tax_2d = ReportHelper.taxon_counts_cleanup(taxon_counts)
      ReportHelper.only_species_or_genus_counts!(tax_2d, species_selected)

      rows = []
      tax_2d.each do |_tax_id, tax_info|
        rows << tax_info
      end

      ReportHelper.compute_aggregate_scores_v2!(rows)
      rows = rows.select do |row|
        row["NT"]["maxzscore"] >= MINIMUM_ZSCORE_THRESHOLD && ReportHelper.check_custom_filters(row, threshold_filters)
      end

      rows.sort_by! { |tax_info| ((tax_info[count_type] || {})[metric] || 0.0) * -1.0 }
      count = 1
      # get the top N for each sample
      rows.each do |row|
        taxon = if candidate_taxons[row["tax_id"]]
                  candidate_taxons[row["tax_id"]]
                else
                  { "tax_id" => row["tax_id"], "samples" => {} }
                end
        taxon["max_aggregate_score"] = row[sort_by[:count_type]][sort_by[:metric]] if taxon["max_aggregate_score"].to_f < row[sort_by[:count_type]][sort_by[:metric]].to_f
        taxon["samples"][sample_id] = [count, row["tax_level"], row["NT"]["zscore"], row["NR"]["zscore"]]
        candidate_taxons[row["tax_id"]] = taxon
        break if count >= num_results
        count += 1
      end
    end

    candidate_taxons.values.sort_by { |taxon| -1.0 * taxon["max_aggregate_score"].to_f }
  end

  def self.fetch_top_taxons(samples, background_id, categories, read_specificity = false, include_phage = false, num_results = 1_000_000)
    pipeline_run_ids = samples.map { |s| s.first_pipeline_run ? s.first_pipeline_run.id : nil }.compact

    categories_clause = ""
    if categories.present?
      categories_clause = " AND taxon_counts.superkingdom_taxid IN (#{categories.map { |category| CATEGORIES_TAXID_BY_NAME[category] }.compact.join(',')})"
    elsif include_phage
      categories_clause = " AND taxon_counts.superkingdom_taxid = #{CATEGORIES_TAXID_BY_NAME['Viruses']}"
    end

    read_specificity_clause = ""
    if read_specificity
      read_specificity_clause = " AND taxon_counts.tax_id > 0"
    end

    if !include_phage && categories.present?
      phage_clause = " AND taxon_counts.is_phage != 1"
    elsif include_phage && categories.blank?
      phage_clause = " AND taxon_counts.is_phage = 1"
    end

    query = "
    SELECT
      taxon_counts.pipeline_run_id     AS  pipeline_run_id,
      taxon_counts.tax_id              AS  tax_id,
      taxon_counts.count_type          AS  count_type,
      taxon_counts.tax_level           AS  tax_level,
      taxon_counts.genus_taxid         AS  genus_taxid,
      taxon_counts.family_taxid        AS  family_taxid,
      taxon_counts.name                AS  name,
      taxon_counts.superkingdom_taxid  AS  superkingdom_taxid,
      taxon_counts.is_phage            AS  is_phage,
      taxon_counts.count               AS  r,
      taxon_summaries.stdev            AS stdev,
      taxon_summaries.mean             AS mean,
      taxon_counts.percent_identity    AS  percentidentity,
      taxon_counts.alignment_length    AS  alignmentlength,
      IF(
        taxon_counts.e_value IS NOT NULL,
        (0.0 - taxon_counts.e_value),
        #{ReportHelper::DEFAULT_SAMPLE_NEGLOGEVALUE}
      )                                AS  neglogevalue,
      taxon_counts.percent_concordant  AS  percentconcordant
    FROM taxon_counts
    LEFT OUTER JOIN taxon_summaries ON
      #{background_id.to_i}   = taxon_summaries.background_id   AND
      taxon_counts.count_type = taxon_summaries.count_type      AND
      taxon_counts.tax_level  = taxon_summaries.tax_level       AND
      taxon_counts.tax_id     = taxon_summaries.tax_id
    WHERE
      pipeline_run_id in (#{pipeline_run_ids.join(',')})
      AND taxon_counts.genus_taxid != #{TaxonLineage::BLACKLIST_GENUS_ID}
      AND taxon_counts.count >= #{MINIMUM_READ_THRESHOLD}
      AND taxon_counts.count_type IN ('NT', 'NR')
      #{categories_clause}
      #{read_specificity_clause}
      #{phage_clause}
    LIMIT #{num_results}
     "
    sql_results = TaxonCount.connection.select_all(query).to_hash

    # calculating rpm and zscore, organizing the results by pipeline_run_id
    result_hash = {}

    pipeline_run_ids = sql_results.map { |x| x['pipeline_run_id'] }
    pipeline_runs = PipelineRun.where(id: pipeline_run_ids.uniq).includes([:sample])
    pipeline_runs_by_id = Hash[pipeline_runs.map { |x| [x.id, x] }]

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
        row["rpm"] = row["r"] / ((pr.total_reads - pr.total_ercc_reads.to_i) * pr.subsample_fraction) * 1_000_000.0
        row["zscore"] = row["stdev"].nil? ? z_default : ((row["rpm"] - row["mean"]) / row["stdev"])
        row["zscore"] = z_max if row["zscore"] > z_max && row["zscore"] != z_default
        row["zscore"] = z_min if row["zscore"] < z_min
        result_hash[pipeline_run_id]["taxon_counts"] << row
      end
    end
    result_hash
  end

  def self.samples_taxons_details(samples, taxon_ids, background_id, species_selected, threshold_filters)
    results = {}

    # Get sample results for the taxon ids
    unless taxon_ids.empty?
      samples_by_id = Hash[samples.map { |s| [s.id, s] }]
      parent_ids = ReportHelper.fetch_parent_ids(taxon_ids, samples)
      results_by_pr = ReportHelper.fetch_samples_taxons_counts(samples, taxon_ids, parent_ids, background_id)
      results_by_pr.each do |_pr_id, res|
        pr = res["pr"]
        taxon_counts = res["taxon_counts"]
        sample_id = pr.sample_id
        tax_2d = ReportHelper.taxon_counts_cleanup(taxon_counts)
        ReportHelper.only_species_or_genus_counts!(tax_2d, species_selected)

        rows = []
        tax_2d.each { |_tax_id, tax_info| rows << tax_info }
        ReportHelper.compute_aggregate_scores_v2!(rows)

        filtered_rows = rows
                        .select { |row| taxon_ids.include?(row["tax_id"]) }
                        .each { |row| row[:filtered] = ReportHelper.check_custom_filters(row, threshold_filters) }

        results[sample_id] = {
          sample_id: sample_id,
          name: samples_by_id[sample_id].name,
          metadata: samples_by_id[sample_id].metadata_with_base_type,
          host_genome_name: samples_by_id[sample_id].host_genome_name,
          taxons: filtered_rows
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
          host_genome_name: sample.host_genome_name
        }
      end
    end

    # Flatten the hash
    results.values
  end
end
