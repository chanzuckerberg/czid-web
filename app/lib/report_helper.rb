require 'csv'
require 'open3'

module ReportHelper
  # Truncate report table past this number of rows.
  TAXON_CATEGORY_OFFSET = 100_000_000
  ZSCORE_MIN = -99
  ZSCORE_MAX =  99
  ZSCORE_WHEN_ABSENT_FROM_SAMPLE = -100
  ZSCORE_WHEN_ABSENT_FROM_BACKGROUND = 100

  DEFAULT_SAMPLE_NEGLOGEVALUE = 0.0
  DEFAULT_SAMPLE_PERCENTIDENTITY = 0.0
  DEFAULT_SAMPLE_ALIGNMENTLENGTH = 0.0
  DEFAULT_SAMPLE_PERCENTCONCORDANT = 0.0

  MINIMUM_READ_THRESHOLD = 5
  MINIMUM_ZSCORE_THRESHOLD = 1.7

  # For taxon_count 'species' rows without a corresponding 'genus' rows,
  # we create a fake singleton genus containing just that species;
  # the fake genus IDs start here:
  FAKE_GENUS_BASE = -1_900_000_000

  DECIMALS = 7

  DEFAULT_SORT_PARAM = 'highest_nt_aggregatescore'.freeze
  DEFAULT_TAXON_SORT_PARAM = 'highest_nt_aggregatescore'.freeze
  DEFAULT_PARAMS = { sort_by: DEFAULT_SORT_PARAM }.freeze

  IGNORED_PARAMS = [:controller, :action, :id].freeze

  IGNORE_IN_DOWNLOAD = [[:species_count], [:NT, :count_type], [:NR, :count_type], [:NR, :aggregatescore]].freeze

  SORT_DIRECTIONS = %w[highest lowest].freeze
  # We do not allow underscores in metric names, sorry!
  METRICS = %w[r rpm zscore percentidentity alignmentlength neglogevalue percentconcordant aggregatescore maxzscore r_pct rpm_bg].freeze
  COUNT_TYPES = %w[NT NR].freeze
  # Note: no underscore in sortable column names. Add to here to protect from data cleaning.
  PROPERTIES_OF_TAXID = %w[tax_id name common_name tax_level species_taxid genus_taxid family_taxid superkingdom_taxid category_name is_phage].freeze
  UNUSED_IN_UI_FIELDS = ['superkingdom_taxid', :sort_key].freeze

  # This query takes 1.4 seconds and the results are static, so we hardcoded it
  # mysql> select distinct(superkingdom_taxid) as taxid, IF(superkingdom_name IS NOT NULL, superkingdom_name, 'Uncategorized') as name from taxon_lineages;
  # +-------+---------------+
  # | taxid | name          |
  # +-------+---------------+
  # |  -700 | Uncategorized |
  # |     2 | Bacteria      |
  # |  2157 | Archaea       |
  # |  2759 | Eukaryota     |
  # | 10239 | Viruses       |
  # | 12884 | Viroids       |
  # +-------+---------------+
  ALL_CATEGORIES = [
    { 'taxid' => 2, 'name' => "Bacteria" },
    { 'taxid' => 2157, 'name' => "Archaea" },
    { 'taxid' => 2759, 'name' => "Eukaryota" },
    { 'taxid' => 10_239, 'name' => "Viruses" },
    { 'taxid' => 12_884, 'name' => "Viroids" },
    { 'taxid' => TaxonLineage::MISSING_SUPERKINGDOM_ID, 'name' => "Uncategorized" }
  ].freeze
  CATEGORIES_TAXID_BY_NAME = ALL_CATEGORIES.map { |category| { category['name'] => category['taxid'] } }.reduce({}, :merge)

  # use the metric's NT <=> NR dual as a tertiary sort key (so, for example,
  # when you sort by NT R, entries without NT R will be ordered amongst
  # themselves based on their NR R (as opposed to arbitrary ordder);
  # and within the Z, for things with equal Z, use the R as tertiary
  OTHER_COUNT_TYPE = {
    'NT' => 'NR',
    'NR' => 'NT'
  }.freeze
  OTHER_METRIC = {
    'zscore' => 'r',
    'r' => 'zscore',
    'rpm' => 'zscore'
  }.freeze

  def threshold_param?(param_key)
    parts = param_key.to_s.split "_"
    (parts.length == 3 && parts[0] == 'threshold' && COUNT_TYPES.include?(parts[1].upcase) && METRICS.include?(parts[2]))
  end

  def decode_thresholds(params)
    thresholds = {}
    COUNT_TYPES.each do |count_type|
      thresholds[count_type] = {}
      METRICS.each do |metric|
        param_key = "threshold_#{count_type.downcase}_#{metric}".to_sym
        thresholds[count_type][metric] = params[param_key]
      end
    end
    thresholds
  end

  def decode_sort_by(sort_by)
    parts = sort_by.split "_"
    return nil unless parts.length == 3
    direction = parts[0]
    return nil unless SORT_DIRECTIONS.include? direction
    count_type = parts[1].upcase
    return nil unless COUNT_TYPES.include? count_type
    metric = parts[2]
    return nil unless METRICS.include? metric
    {
      direction:    direction,
      count_type:   count_type,
      metric:       metric
    }
  end

  def number_or_nil(string)
    Float(string || '')
  rescue ArgumentError
    nil
  end

  ZERO_ONE = {
    '0' => 0,
    '1' => 1
  }.freeze

  def valid_arg_value(name, value, all_cats)
    # return appropriately validated value (based on name), or nil
    return nil unless value
    if name == :sort_by
      value = nil unless decode_sort_by(value)
    elsif name == :excluded_categories
      value = validated_excluded_categories_or_nil(value, all_cats)
    elsif name == :selected_genus
      # This gets validated later in taxonomy_details()
      value = value
    elsif name == :disable_filters
      value = ZERO_ONE[value]
    else
      value = nil unless threshold_param?(name)
      value = number_or_nil(value)
    end
    value
  end

  def decode_excluded_categories(param_str)
    Set.new(param_str.split(",").map { |x| x.strip.capitalize })
  end

  def validated_excluded_categories_or_nil(str, all_cats)
    all_categories = Set.new(all_cats.map { |x| x['name'] })
    all_categories.add('None')
    excluded_categories = all_categories & decode_excluded_categories(str)
    validated_str = Array(excluded_categories).map(&:capitalize).join(',')
    !validated_str.empty? ? validated_str : nil
  end

  def external_report_info(pipeline_run_id, background_id, params)
    return {} if pipeline_run_id.nil? || background_id.nil?
    data = {}

    # Pass the background info so it can be set in the frontend directly
    # for whatever was loaded.
    # Find the background name from the id. Safely returns nil if not found.
    bg = current_power.backgrounds.find_by(id: background_id.to_i)
    if bg
      data[:background_info] = {}
      data[:background_info][:name] = bg.name
      data[:background_info][:id] = bg.id
    end

    data[:taxonomy_details] = taxonomy_details(pipeline_run_id, background_id, params)
    data
  end

  def label_top_scoring_taxa!(tax_map)
    # Rule:
    #   top n hits that satisfy:
    #     NT.zscore > min_z AND
    #     NR.zscore > min_z AND
    #     NT.rpm > min_rpm AND
    #     NR.rpm > min_rpm AND
    #     tax_id > 0
    #   Besides labeling taxa as "top-scoring" in-place, the function also returns a list
    #   of top-scoring taxa for the "executive summary" at the top of a report.
    #   In the interest of space, we do not list a genus if one of its species is already included.
    top_taxa = []
    i = 0
    genus_included = false
    ui_config = UiConfig.last
    min_nt_z = ui_config.min_nt_z || 1
    min_nr_z = ui_config.min_nr_z || 1
    min_nt_rpm = ui_config.min_nt_rpm || 1
    min_nr_rpm = ui_config.min_nr_rpm || 1
    n = ui_config.top_n || 3
    tax_map.each do |tax|
      break if top_taxa.length >= n && tax["tax_level"] == TaxonCount::TAX_LEVEL_GENUS
      if tax["tax_id"] > 0 && tax["NT"]["zscore"] > min_nt_z && tax["NR"]["zscore"] > min_nr_z && tax["NT"]["rpm"] > min_nt_rpm && tax["NR"]["rpm"] > min_nr_rpm
        if tax["tax_level"] == TaxonCount::TAX_LEVEL_SPECIES && genus_included
          top_taxa.pop
          genus_included = false
        end
        if top_taxa.length < n
          tax["topScoring"] = 1
          top_taxa << tax
          genus_included = true if tax["tax_level"] == TaxonCount::TAX_LEVEL_GENUS
        end
      end
      i += 1
    end
    top_taxa
  end

  def taxon_confirmation_map(sample_id, user_id)
    taxon_confirmations = TaxonConfirmation.where(sample_id: sample_id)
    confirmed = taxon_confirmations.where(strength: TaxonConfirmation::CONFIRMED)
    watched = taxon_confirmations.where(strength: TaxonConfirmation::WATCHED, user_id: user_id)
    { watched_taxids: watched.pluck(:taxid).uniq,
      confirmed_taxids: confirmed.pluck(:taxid).uniq,
      confirmed_names: confirmed.pluck(:name).uniq }
  end

  def report_details(pipeline_run, user_id)
    # Provides some auxiliary information on pipeline_run, including default background for sample.
    # No report-specific scores though.
    sample = pipeline_run.sample
    taxon_confirmation_hash = taxon_confirmation_map(sample.id, user_id)
    {
      pipeline_info: pipeline_run,
      subsampled_reads: pipeline_run.subsampled_reads,
      sample_info: sample,
      default_background: Background.find(pipeline_run.sample.default_background_id),
      taxon_fasta_flag: !pipeline_run.taxon_byteranges.empty?,
      confirmed_taxids: taxon_confirmation_hash[:confirmed_taxids],
      watched_taxids: taxon_confirmation_hash[:watched_taxids],
      confirmed_names: taxon_confirmation_hash[:confirmed_names],
      assembled_taxids: pipeline_run.assembled_taxids ? JSON.parse(pipeline_run.assembled_taxids) : []
    }
  end

  def all_categories
    ALL_CATEGORIES
  end

  def fetch_taxon_counts(pipeline_run_id, background_id, refined = false)
    pipeline_run = PipelineRun.find(pipeline_run_id)
    adjusted_total_reads = (pipeline_run.total_reads - pipeline_run.total_ercc_reads.to_i) * pipeline_run.subsample_fraction
    raw_non_host_reads = pipeline_run.adjusted_remaining_reads.to_f * pipeline_run.subsample_fraction
    # only turned on refined with the right pipeline version and output
    refined_output = TaxonCount.where(pipeline_run_id: pipeline_run.id).where(count_type: ['NT+', 'NR+']).count
    refined = false unless pipeline_run.pipeline_version.to_f >= 3.0 && refined_output > 0

    count_types = refined ? "('NT+','NR+')" : "('NT','NR')"

    # NOTE:  If you add more columns to be fetched here, you really should add them to PROPERTIES_OF_TAXID above
    # otherwise they will not survive cleaning.
    TaxonCount.connection.select_all("
      SELECT
        taxon_counts.tax_id              AS  tax_id,
        SUBSTR(taxon_counts.count_type, 1, 2)          AS  count_type,
        taxon_counts.tax_level           AS  tax_level,

        taxon_counts.genus_taxid         AS  genus_taxid,
        taxon_counts.family_taxid        AS  family_taxid,
        taxon_counts.name                AS  name,
        taxon_counts.common_name         AS  common_name,
        taxon_counts.superkingdom_taxid  AS  superkingdom_taxid,
        taxon_counts.is_phage            AS  is_phage,
        taxon_counts.count               AS  r,
        IF(taxon_summaries.mean IS NOT NULL, taxon_summaries.mean, 0.0) AS rpm_bg,
        (count / #{adjusted_total_reads}
          * 1000000.0)                   AS  rpm,
        (taxon_counts.count/#{raw_non_host_reads} * 100.0)  AS  r_pct,
        IF(
          stdev IS NOT NULL,
          GREATEST(#{ZSCORE_MIN}, LEAST(#{ZSCORE_MAX}, (((count / #{adjusted_total_reads} * 1000000.0) - mean) / stdev))),
          #{ZSCORE_WHEN_ABSENT_FROM_BACKGROUND}
        )
                                         AS  zscore,
        taxon_counts.percent_identity    AS  percentidentity,
        taxon_counts.alignment_length    AS  alignmentlength,
        IF(
          taxon_counts.e_value IS NOT NULL,
          (0.0 - taxon_counts.e_value),
          #{DEFAULT_SAMPLE_NEGLOGEVALUE}
        )                                AS  neglogevalue,
        taxon_counts.percent_concordant  AS  percentconcordant
      FROM taxon_counts
      LEFT OUTER JOIN taxon_summaries ON
        #{background_id.to_i}   = taxon_summaries.background_id   AND
        taxon_counts.count_type = taxon_summaries.count_type      AND
        taxon_counts.tax_level  = taxon_summaries.tax_level       AND
        taxon_counts.tax_id     = taxon_summaries.tax_id
      WHERE
        pipeline_run_id = #{pipeline_run_id.to_i} AND
        taxon_counts.genus_taxid != #{TaxonLineage::BLACKLIST_GENUS_ID} AND
        taxon_counts.count_type IN #{count_types}
    ").to_hash
  end

  def fetch_top_taxons(samples, background_id, categories, read_specificity = false, include_phage = false)
    pipeline_run_ids = samples.map { |s| s.pipeline_runs.first ? s.pipeline_runs.first.id : nil }.compact

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
        #{DEFAULT_SAMPLE_NEGLOGEVALUE}
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
      row["rpm"] = row["r"] / ((pr.total_reads - pr.total_ercc_reads.to_i) * pr.subsample_fraction) * 1_000_000.0
      row["zscore"] = row["stdev"].nil? ? ZSCORE_WHEN_ABSENT_FROM_BACKGROUND : ((row["rpm"] - row["mean"]) / row["stdev"])
      row["zscore"] = ZSCORE_MAX if row["zscore"] > ZSCORE_MAX && row["zscore"] != ZSCORE_WHEN_ABSENT_FROM_BACKGROUND
      row["zcore"] = ZSCORE_MIN if row["zscore"] < ZSCORE_MIN
      result_hash[pipeline_run_id]["taxon_counts"] << row
    end
    result_hash
  end

  def fetch_parent_ids(taxon_ids, samples)
    # Get parent (genus,family) ids for the taxon_ids based on the samples
    pipeline_run_ids = PipelineRun.where(sample_id: samples.pluck(:id)).pluck(:id)
    TaxonCount.select("distinct genus_taxid, family_taxid")
              .where(pipeline_run_id: pipeline_run_ids)
              .where(tax_id: taxon_ids)
              .map { |u| u.attributes.values.compact }.flatten
  end

  def fetch_samples_taxons_counts(samples, taxon_ids, parent_ids, background_id)
    pipeline_run_ids = samples.map { |s| s.pipeline_runs.first ? s.pipeline_runs.first.id : nil }.compact
    parent_ids = parent_ids.to_a
    parent_ids_clause = parent_ids.empty? ? "" : " OR taxon_counts.tax_id in (#{parent_ids.join(',')}) "

    # Note: subsample_fraction is of type 'float' so adjusted_total_reads is too
    # Note: stdev is never 0
    # Note: connection.select_all is TWICE faster than TaxonCount.select
    # (I/O latency goes from 2 seconds -> 0.8 seconds)
    # Had to derive rpm and zscore for each sample
    sql_results = TaxonCount.connection.select_all("
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
          #{DEFAULT_SAMPLE_NEGLOGEVALUE}
        )                                AS  neglogevalue,
        taxon_counts.percent_concordant  AS  percentconcordant
      FROM taxon_counts
      LEFT OUTER JOIN taxon_summaries ON
        #{background_id.to_i}   = taxon_summaries.background_id   AND
        taxon_counts.count_type = taxon_summaries.count_type      AND
        taxon_counts.tax_level  = taxon_summaries.tax_level       AND
        taxon_counts.tax_id     = taxon_summaries.tax_id
      WHERE
        pipeline_run_id in (#{pipeline_run_ids.join(',')}) AND
        taxon_counts.genus_taxid != #{TaxonLineage::BLACKLIST_GENUS_ID} AND
        taxon_counts.count_type IN ('NT', 'NR') AND
        (taxon_counts.tax_id IN (#{taxon_ids.join(',')})
         #{parent_ids_clause}
         OR taxon_counts.genus_taxid IN (#{taxon_ids.join(',')}))").to_hash

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
      row["rpm"] = row["r"] / ((pr.total_reads - pr.total_ercc_reads.to_i) * pr.subsample_fraction) * 1_000_000.0
      row["zscore"] = row["stdev"].nil? ? ZSCORE_WHEN_ABSENT_FROM_BACKGROUND : ((row["rpm"] - row["mean"]) / row["stdev"])
      row["zscore"] = ZSCORE_MAX if row["zscore"] > ZSCORE_MAX && row["zscore"] != ZSCORE_WHEN_ABSENT_FROM_BACKGROUND
      row["zcore"] = ZSCORE_MIN if row["zscore"] < ZSCORE_MIN
      result_hash[pipeline_run_id]["taxon_counts"] << row
    end

    result_hash
  end

  def samples_taxons_details(samples, taxon_ids, background_id, species_selected)
    samples_by_id = Hash[samples.map { |s| [s.id, s] }]
    parent_ids = fetch_parent_ids(taxon_ids, samples)
    results_by_pr = fetch_samples_taxons_counts(samples, taxon_ids, parent_ids, background_id)
    results = []
    results_by_pr.each do |_pr_id, res|
      pr = res["pr"]
      taxon_counts = res["taxon_counts"]
      sample_id = pr.sample_id
      tax_2d = taxon_counts_cleanup(taxon_counts)
      only_species_or_genus_counts!(tax_2d, species_selected)

      rows = []
      tax_2d.each { |_tax_id, tax_info| rows << tax_info }
      compute_aggregate_scores_v2!(rows)

      filtered_rows = []
      rows.each do |row|
        filtered_rows << row if taxon_ids.include?(row["tax_id"])
      end

      results << {
        sample_id: sample_id,
        name: samples_by_id[sample_id].name,
        taxons: filtered_rows
      }
    end
    results
  end

  def check_custom_filters(row, threshold_filters)
    threshold_filters.each do |filter|
      count_type, metric = filter["metric"].split("_")
      begin
        value = Float(filter["value"])
      rescue
        Rails.logger.warn "Bad threshold filter value."
      else
        if filter["operator"] == ">="
          if row[count_type][metric] < value
            return false
          end
        elsif row[count_type][metric] > value
          return false
        end
      end
    end
    true
  end

  def top_taxons_details(samples, background_id, num_results, sort_by_key, species_selected, categories, threshold_filters = {}, read_specificity = false, include_phage = false)
    # return top taxons
    results_by_pr = fetch_top_taxons(samples, background_id, categories, read_specificity, include_phage)

    sort_by = decode_sort_by(sort_by_key)
    count_type = sort_by[:count_type]
    metric = sort_by[:metric]
    candidate_taxons = {}
    results_by_pr.each do |_pr_id, res|
      pr = res["pr"]
      taxon_counts = res["taxon_counts"]
      sample_id = pr.sample_id

      tax_2d = taxon_counts_cleanup(taxon_counts)
      only_species_or_genus_counts!(tax_2d, species_selected)

      rows = []
      tax_2d.each do |_tax_id, tax_info|
        rows << tax_info
      end

      compute_aggregate_scores_v2!(rows)
      rows = rows.select do |row|
        row["NT"]["maxzscore"] >= MINIMUM_ZSCORE_THRESHOLD && check_custom_filters(row, threshold_filters)
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

  def zero_metrics(count_type)
    {
      'count_type' => count_type,
      'r' => 0,
      'rpm' => 0,
      'zscore' => ZSCORE_WHEN_ABSENT_FROM_SAMPLE,
      'percentidentity' => DEFAULT_SAMPLE_PERCENTIDENTITY,
      'alignmentlength' => DEFAULT_SAMPLE_ALIGNMENTLENGTH,
      'neglogevalue' => DEFAULT_SAMPLE_NEGLOGEVALUE,
      'percentconcordant' => DEFAULT_SAMPLE_PERCENTCONCORDANT,
      'aggregatescore' => nil
    }
  end

  def fetch_lineage_info(pipeline_run_id)
    lineage_records = TaxonLineage.connection.select_all(TaxonLineage.where(
      "taxid in (select tax_id from taxon_counts
                 where pipeline_run_id = #{pipeline_run_id}
                   and tax_level = #{TaxonCount::TAX_LEVEL_SPECIES})"
    ).to_sql).to_a
    result_map = {}
    search_key_list = Set.new
    sort_map = {}

    n2la = TaxonCount::NAME_2_LEVEL.to_a
    lineage_records.each do |lr|
      key_array = []
      n2la.each do |category, level|
        tax_name = lr["#{category}_name"]
        tax_id = lr["#{category}_taxid"]
        next unless tax_name && tax_name.strip.present?
        display_name = "#{tax_name} (#{category})"
        sort_key = "#{(10 - level)}-#{tax_name}"
        search_id = level * TAXON_CATEGORY_OFFSET + tax_id
        sort_map[search_id] = sort_key
        key_array << search_id
        search_key_list.add([display_name, search_id])
      end
      result_map[lr['taxid']] = key_array
    end

    search_key_list = search_key_list.sort_by { |u| sort_map[u[1]] }
    { lineage_map: result_map, search_list: search_key_list }
  end

  def tax_info_base(taxon)
    tax_info_base = {}
    PROPERTIES_OF_TAXID.each do |prop|
      tax_info_base[prop] = taxon[prop]
    end
    COUNT_TYPES.each do |count_type|
      tax_info_base[count_type] = zero_metrics(count_type)
    end
    tax_info_base
  end

  def metric_props(taxon)
    metric_props = zero_metrics(taxon['count_type'])
    METRICS.each do |metric|
      metric_props[metric] = taxon[metric].round(DECIMALS) if taxon[metric]
    end
    metric_props
  end

  def fake_genus!(tax_info)
    # Create a singleton genus containing just this taxon
    #
    # This is a workaround for a bug we are fixing soon... but leaving
    # in the code lest that bug recurs.  A warning will be logged.
    #
    fake_genus_info = tax_info.clone
    fake_genus_info['name'] = "Ad hoc bucket for #{tax_info['name'].downcase}"
    fake_genus_id = FAKE_GENUS_BASE - tax_info['tax_id']
    fake_genus_info['tax_id'] = fake_genus_id
    fake_genus_info['genus_taxid'] = fake_genus_id
    fake_genus_info['tax_level'] = TaxonCount::TAX_LEVEL_GENUS
    tax_info['genus_taxid'] = fake_genus_id
    fake_genus_info
  end

  def convert_2d(taxon_counts_from_sql)
    # Return data structured as
    #    tax_id => {
    #       tax_id,
    #       tax_level,
    #       genus_taxid,
    #       family_taxid,
    #       species_count,
    #       name,
    #       common_name,
    #       category_name,
    #       is_phage,
    #       NR => {
    #         count_type,
    #         r,
    #         rpm
    #         zscore
    #       }
    #       NT => {
    #         count_type,
    #         r,
    #         rpm
    #         zscore
    #       }
    #    }
    taxon_counts_2d = {}
    taxon_counts_from_sql.each do |t|
      taxon_counts_2d[t['tax_id']] ||= tax_info_base(t)
      taxon_counts_2d[t['tax_id']][t['count_type']] = metric_props(t)
    end
    taxon_counts_2d
  end

  def cleanup_genus_ids!(taxon_counts_2d)
    # We might rewrite the query to be super sure of this
    taxon_counts_2d.each do |tax_id, tax_info|
      # Fill in missing info since the pipeline doesn't yet emit these.
      tax_info['species_taxid'] = if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
                                    tax_id
                                  else
                                    TaxonLineage::MISSING_SPECIES_ID
                                  end

      if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_GENUS
        tax_info['genus_taxid'] = tax_id
      end
      if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_FAMILY
        tax_info['family_taxid'] = tax_id
      end
    end
    taxon_counts_2d
  end

  def validate_names!(tax_2d)
    # This converts superkingdom_id to category_name and makes up
    # suitable names for missing and blacklisted genera and species.
    category = {}
    ALL_CATEGORIES.each do |c|
      category[c['taxid']] = c['name']
    end
    missing_names = Set.new
    missing_parents = {}

    tax_2d.each do |tax_id, tax_info|
      level_str = TaxonLineage.level_name(tax_info['tax_level'])
      if tax_id < 0
        # Usually -1 means accession number did not resolve to species.
        # TODO: Can we keep the accession numbers to show in these cases?
        tax_info['name'] = "All taxa with neither family nor genus classification"

        if tax_id < TaxonLineage::INVALID_CALL_BASE_ID && species_or_genus(tax_info['tax_level'])
          parent_id = convert_neg_taxid(tax_id)
          if tax_2d[parent_id]
            parent_name = tax_2d[parent_id]['name']
            parent_level = TaxonLineage.level_name(tax_2d[parent_id]['tax_level'])
          else
            missing_parents[parent_id] = tax_id
            parent_name = "taxon #{parent_id}"
            parent_level = ""
          end
          tax_info['name'] = "Non-#{level_str}-specific reads in #{parent_level} #{parent_name}"
        elsif tax_id == TaxonLineage::BLACKLIST_GENUS_ID
          tax_info['name'] = "All artificial constructs"
        elsif !(TaxonLineage::MISSING_LINEAGE_ID.values.include? tax_id) && tax_id != TaxonLineage::MISSING_SPECIES_ID_ALT
          tax_info['name'] += " #{tax_id}"
        end
      elsif !tax_info['name']
        missing_names.add(tax_id)
        tax_info['name'] = "Unnamed #{level_str} taxon #{tax_id}"
      end
      category_id = tax_info.delete('superkingdom_taxid')
      tax_info['category_name'] = category[category_id] || 'Uncategorized'
    end

    Rails.logger.warn "Missing names for taxon ids #{missing_names.to_a}" unless missing_names.empty?
    Rails.logger.warn "Missing parent for child:  #{missing_parents}" unless missing_parents.empty?
    tax_2d
  end

  def cleanup_missing_genus_counts!(taxon_counts_2d)
    # there should be a genus_pair for every species (even if it is the pseudo
    # genus id -200);  anything else indicates a bug in data import;
    # warn and ensure affected data is NOT hidden from view
    fake_genera = []
    missing_genera = Set.new
    taxids_with_missing_genera = Set.new
    taxon_counts_2d.each do |tax_id, tax_info|
      genus_taxid = tax_info['genus_taxid']
      unless taxon_counts_2d[genus_taxid] || tax_info['tax_level'] != TaxonCount::TAX_LEVEL_SPECIES
        taxids_with_missing_genera.add(tax_id)
        missing_genera.add(genus_taxid)
        fake_genera << fake_genus!(tax_info)
      end
    end
    Rails.logger.warn "Missing taxon_counts for genus ids #{missing_genera.to_a} corresponding to taxon ids #{taxids_with_missing_genera.to_a}." unless missing_genera.empty?
    fake_genera.each do |fake_genus_info|
      taxon_counts_2d[fake_genus_info['genus_taxid']] = fake_genus_info
    end
    taxon_counts_2d
  end

  def count_species_per_genus!(taxon_counts_2d)
    taxon_counts_2d.each do |_tax_id, tax_info|
      tax_info['species_count'] = 0
    end
    taxon_counts_2d.each do |_tax_id, tax_info|
      next unless tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
      genus_info = taxon_counts_2d[tax_info['genus_taxid']]
      genus_info['species_count'] += 1
    end
    taxon_counts_2d
  end

  def remove_family_level_counts!(taxon_counts_2d)
    taxon_counts_2d.keep_if { |_tax_id, tax_info| tax_info['tax_level'] != TaxonCount::TAX_LEVEL_FAMILY }
  end

  def only_species_level_counts!(taxon_counts_2d)
    taxon_counts_2d.keep_if { |_tax_id, tax_info| tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES }
  end

  def only_genus_level_counts!(taxon_counts_2d)
    taxon_counts_2d.keep_if { |_tax_id, tax_info| tax_info['tax_level'] == TaxonCount::TAX_LEVEL_GENUS }
  end

  def taxon_counts_cleanup(taxon_counts)
    # convert_2d also does some filtering.
    tax_2d = convert_2d(taxon_counts)
    cleanup_genus_ids!(tax_2d)
    validate_names!(tax_2d)
    cleanup_missing_genus_counts!(tax_2d)
    tax_2d
  end

  def negative(vec_10d)
    vec_10d.map { |x| -(x || 0.0) }
    # vec_10d.map(&:-@)
  end

  def sort_key(tax_2d, tax_info, sort_by)
    # sort by (genus, species) in the chosen metric, making sure that
    # the genus comes before its species in either sort direction
    genus_id = tax_info['genus_taxid']
    genus_info = tax_2d[genus_id]
    # this got a lot longer after it became clear that we want other_type and other_metric
    # TODO: refactor
    sort_count_type = sort_by[:count_type]
    other_count_type = OTHER_COUNT_TYPE.fetch(sort_count_type, sort_count_type)
    sort_metric = sort_by[:metric]
    other_metric = OTHER_METRIC.fetch(sort_metric, sort_metric)
    sort_key_genus = genus_info[sort_count_type][sort_metric]
    sort_key_genus_alt = genus_info[other_count_type][sort_metric]
    sort_key_genus_om = genus_info[sort_count_type][other_metric]
    sort_key_genus_om_alt = genus_info[other_count_type][other_metric]
    if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
      sort_key_species = tax_info[sort_count_type][sort_metric]
      sort_key_species_alt = tax_info[other_count_type][sort_metric]
      sort_key_species_om = tax_info[sort_count_type][other_metric]
      sort_key_species_om_alt = tax_info[other_count_type][other_metric]
      # sort_key_3d = [sort_key_genus, sort_key_genus_alt, sort_key_genus_om, sort_key_genus_om_alt, genus_id, 0, sort_key_species, sort_key_species_alt, sort_key_species_om, sort_key_species_om_alt]
      sort_key_3d = [sort_key_genus, sort_key_genus_om, sort_key_genus_alt, sort_key_genus_om_alt, genus_id, 0, sort_key_species, sort_key_species_om, sort_key_species_alt, sort_key_species_om_alt]
    else
      genus_priority = sort_by[:direction] == 'highest' ? 1 : -1
      # sort_key_3d = [sort_key_genus, sort_key_genus_alt, sort_key_genus_om, sort_key_genus_om_alt, genus_id, genus_priority, 0, 0, 0, 0]
      sort_key_3d = [sort_key_genus, sort_key_genus_om, sort_key_genus_alt, sort_key_genus_om_alt, genus_id, genus_priority, 0, 0, 0, 0]
    end
    sort_by[:direction] == 'lowest' ? sort_key_3d : negative(sort_key_3d)
  end

  def filter_rows!(rows, thresholds, excluded_categories)
    # filter out rows that are below the thresholds
    # but make sure not to delete any genus row for which some species
    # passes the filters
    to_delete = Set.new
    to_keep = Set.new
    rows.each do |tax_info|
      should_delete = false
      # if any metric is below threshold in the specified type, delete
      METRICS.any? do |metric|
        COUNT_TYPES.any? do |count_type|
          should_delete = !(tax_info[count_type][metric]) || (thresholds[count_type][metric] && tax_info[count_type][metric] < thresholds[count_type][metric])
          # aggregatescore is null for genera, and thus not considered in filtering genera
        end
      end
      if tax_info['tax_id'] != TaxonLineage::MISSING_GENUS_ID && tax_info['tax_id'] != TaxonLineage::BLACKLIST_GENUS_ID
        if excluded_categories.include? tax_info['category_name']
          # The only way a species and its genus can have different category
          # names:  If genus_id == MISSING_GENUS_ID or BLACKLIST_GENUS_ID.
          should_delete = true
        end
      end
      if should_delete
        to_delete.add(tax_info['tax_id'])
      else
        # if we are not deleting it, make sure to keep around its genus
        to_keep.add(tax_info['genus_taxid'])
      end
    end
    to_delete.subtract(to_keep)
    rows.keep_if { |tax_info| !to_delete.include? tax_info['tax_id'] }
    rows
  end

  def aggregate_score(genus_info, species_info)
    aggregate = 0.0
    COUNT_TYPES.each do |count_type|
      aggregate += (
        species_info[count_type]['zscore'] *
        genus_info[count_type]['zscore'].abs *
        species_info[count_type]['rpm']
      )
    end
    aggregate
  end

  def aggregate_score_v2(taxon_info)
    aggregate = 0.0
    COUNT_TYPES.each do |count_type|
      aggregate += (
        taxon_info[count_type]['zscore'] *
        taxon_info[count_type]['rpm']
      )
    end
    aggregate
  end

  def compute_aggregate_scores_v2!(rows)
    rows.each do |taxon_info|
      taxon_info['NT']['maxzscore'] = [taxon_info['NT']['zscore'], taxon_info['NR']['zscore']].max
      taxon_info['NR']['maxzscore'] = taxon_info['NT']['maxzscore']
      score = aggregate_score_v2(taxon_info)
      taxon_info['NT']['aggregatescore'] = score.to_f
      taxon_info['NR']['aggregatescore'] = score.to_f
    end
  end

  def compute_genera_aggregate_scores!(rows, tax_2d)
    rows.each do |species_info|
      next unless species_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
      genus_id = species_info['genus_taxid']
      genus_info = tax_2d[genus_id]
      species_score = species_info['NT']['aggregatescore']
      genus_score = genus_info['NT']['aggregatescore']
      unless genus_score && genus_score > species_score
        # genus aggregate score is the max of the specifies scores
        genus_info['NT']['aggregatescore'] = species_score.to_f
        genus_info['NR']['aggregatescore'] = species_score.to_f
      end
    end
  end

  def compute_species_aggregate_scores!(rows, tax_2d, scoring_model)
    scoring_model ||= TaxonScoringModel::DEFAULT_MODEL_NAME
    tsm = TaxonScoringModel.find_by(name: scoring_model)
    rows.each do |species_info|
      species_info['NT']['maxzscore'] = [species_info['NT']['zscore'], species_info['NR']['zscore']].max
      species_info['NR']['maxzscore'] = species_info['NT']['maxzscore']
      next unless species_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
      genus_id = species_info['genus_taxid']
      genus_info = tax_2d[genus_id]
      taxon_info = { "genus" => genus_info, "species" => species_info }
      species_score = tsm.score(taxon_info)
      species_info['NT']['aggregatescore'] = species_score.to_f
      species_info['NR']['aggregatescore'] = species_score.to_f
    end
  end

  def wall_clock_ms
    # used for rudimentary perf analysis
    Time.now.to_f
  end

  def convert_neg_taxid(tax_id)
    thres = TaxonLineage::INVALID_CALL_BASE_ID
    if tax_id < thres
      tax_id = -(tax_id % thres).to_i
    end
    tax_id
  end

  def species_or_genus(tid)
    tid == TaxonCount::TAX_LEVEL_SPECIES || tid == TaxonCount::TAX_LEVEL_GENUS
  end

  # DEPRECATED
  # TODO(yf): remove the following.
  def apply_filters!(rows, tax_2d, all_genera, params)
    thresholds = decode_thresholds(params)
    excluded_categories = decode_excluded_categories(params[:excluded_categories])
    if all_genera.include? params[:selected_genus]
      # Apply only the genus filter.
      rows.keep_if do |tax_info|
        genus_taxid = tax_info['genus_taxid']
        genus_name = tax_2d[genus_taxid]['name']
        genus_name == params[:selected_genus]
      end
    else
      # Rare case of param cleanup this deep...
      params[:selected_genus] = DEFAULT_PARAMS[:selected_genus]
      # Apply all but the genus filter.
      filter_rows!(rows, thresholds, excluded_categories)
    end
  end

  def taxonomy_details(pipeline_run_id, background_id, params)
    # Fetch and clean data.
    t0 = wall_clock_ms
    refined = params[:refined].to_i == 2 ? false : true # default turned on unless set to 2
    taxon_counts = fetch_taxon_counts(pipeline_run_id, background_id, refined)
    tax_2d = taxon_counts_cleanup(taxon_counts)
    t1 = wall_clock_ms

    # These counts are shown in the UI on each genus line.
    count_species_per_genus!(tax_2d)

    # Generate lineage info.
    unfiltered_ids = []
    tax_2d.each do |tid, _|
      unfiltered_ids << tid if tid > 0
    end

    # Remove family level rows because the reports only display species/genus
    remove_family_level_counts!(tax_2d)

    # Add tax_info into output rows.
    rows = []
    tax_2d.each do |_tax_id, tax_info|
      rows << tax_info
    end

    # Compute all species aggregate scores.  These are used in filtering.
    compute_species_aggregate_scores!(rows, tax_2d, params[:scoring_model])
    # Compute all genus aggregate scores.  These are used only in sorting.
    compute_genera_aggregate_scores!(rows, tax_2d)

    # Total number of rows for view level, before application of filters.
    rows_total = tax_2d.length

    # These stats are displayed at the bottom of the page.
    rows_passing_filters = rows.length

    # Compute sort key and sort.
    sort_by = decode_sort_by(params[:sort_by] || DEFAULT_SORT_PARAM)
    rows.each do |tax_info|
      tax_info[:sort_key] = sort_key(tax_2d, tax_info, sort_by)
    end
    rows.sort_by! { |tax_info| tax_info[:sort_key] }

    # Delete fields that are unused in the UI.
    rows.each do |tax_info|
      UNUSED_IN_UI_FIELDS.each do |unused_field|
        tax_info.delete(unused_field)
      end
    end

    t5 = wall_clock_ms
    Rails.logger.info "Data processing took #{t5 - t1} seconds (#{t5 - t0} with I/O)."

    [rows_passing_filters, rows_total, rows]
  end

  def flat_hash(h, f = [], g = {})
    return g.update(f => h) unless h.is_a? Hash
    h.each { |k, r| flat_hash(r, f + [k], g) }
    g
    # example: turn    { :a => { :b => { :c => 1,
    #                                    :d => 2 },
    #                            :e => 3 },
    #                    :f => 4 }
    # into    {[:a, :b, :c] => 1, [:a, :b, :d] => 2, [:a, :e] => 3, [:f] => 4}
  end

  def only_species_or_genus_counts!(tax_2d, species_selected)
    if species_selected # Species selected
      only_species_level_counts!(tax_2d)
    else # Genus selected
      only_genus_level_counts!(tax_2d)
    end
    tax_2d
  end

  def generate_report_csv(tax_details)
    rows = tax_details[2]
    return if rows.blank?
    flat_keys = flat_hash(rows[0]).keys
    flat_keys_symbols = flat_keys.map { |array_key| array_key.map(&:to_sym) }
    attributes_as_symbols = flat_keys_symbols - IGNORE_IN_DOWNLOAD
    attribute_names = attributes_as_symbols.map { |k| k.map(&:to_s).join("_") }
    attribute_names = attribute_names.map { |a| a == 'NT_aggregatescore' ? 'aggregatescore' : a }
    CSV.generate(headers: true) do |csv|
      csv << attribute_names
      rows.each do |tax_info|
        flat_tax_info = flat_hash(tax_info)
        flat_tax_info_by_symbols = flat_tax_info.map { |k, v| [k.map(&:to_sym), v] }.to_h
        csv << flat_tax_info_by_symbols.values_at(*attributes_as_symbols)
      end
    end
  end

  def report_csv_from_params(sample, params)
    params[:is_csv] = 1
    params[:sort_by] = "highest_nt_aggregatescore"
    background_id = params[:background_id] || sample.default_background_id
    background_id = background_id.to_i
    pipeline_run = select_pipeline_run(sample, params)
    pipeline_run_id = pipeline_run ? pipeline_run.id : nil
    return "" if pipeline_run_id.nil? || pipeline_run.total_reads.nil? || pipeline_run.adjusted_remaining_reads.nil?
    tax_details = taxonomy_details(pipeline_run_id, background_id, params)
    generate_report_csv(tax_details)
  end

  def generate_heatmap_csv(sample_taxa_hash)
    attribute_names = %w[sample_name tax_id taxon_name aggregatescore
                         NT_r NT_rpm NT_zscore NR_r NR_rpm NR_zscore]
    CSV.generate(headers: true) do |csv|
      csv << attribute_names
      sample_taxa_hash.each do |sample_record|
        sample_record[:taxons].each do |taxon_record|
          data_values = { sample_name: sample_record[:name],
                          tax_id: taxon_record["tax_id"],
                          taxon_name: taxon_record["name"],
                          aggregatescore: taxon_record["NT"]["aggregatescore"],
                          NT_r: taxon_record["NT"]["r"],
                          NT_rpm: taxon_record["NT"]["rpm"],
                          NT_zscore: taxon_record["NT"]["zscore"],
                          NR_r: taxon_record["NR"]["r"],
                          NR_rpm: taxon_record["NR"]["rpm"],
                          NR_zscore: taxon_record["NR"]["zscore"] }
          csv << data_values.values_at(*attribute_names.map(&:to_sym))
        end
      end
    end
  end

  def select_pipeline_run(sample, params)
    if params[:pipeline_version].blank?
      sample.pipeline_runs.first
    else
      sample.pipeline_run_by_version(params[:pipeline_version])
    end
  end
end
