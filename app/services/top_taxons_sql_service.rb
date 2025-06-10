class TopTaxonsSqlService
  include Callable

  CLIENT_FILTERING_SORT_VALUES = {
    WorkflowRun::WORKFLOW[:short_read_mngs] => { metric: "rpm", direction: "highest" },
    WorkflowRun::WORKFLOW[:long_read_mngs] => { metric: "bpm", direction: "highest" },
  }.freeze

  def initialize(samples, background_id, categories: [], include_phage: false, read_specificity: false, taxon_level: nil, min_reads: HeatmapHelper::MINIMUM_READ_THRESHOLD, taxa_per_sample: HeatmapHelper::CLIENT_FILTERING_TAXA_PER_SAMPLE, threshold_filters: [])
    if samples.nil?
      Rails.logger.warn("TopTaxonsSqlService call with samples = nil")
      samples = []
    end

    sample_workflows = samples.pluck(:initial_workflow).uniq
    if sample_workflows.count > 1
      raise "TopTaxonsSqlService error processing samples with differing workflows: #{sample_workflows}"
    end

    workflow = samples.first.initial_workflow
    unless [WorkflowRun:: WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]].include?(workflow)
      raise "TopTaxonsSqlService error processing samples for workflow: #{workflow}"
    end

    @samples = samples
    @workflow = workflow
    @background_id = background_id # nil for long-read-mngs samples
    @categories = categories
    @include_phage = include_phage
    @read_specificity = read_specificity
    @taxon_level = taxon_level
    @min_reads = min_reads
    @taxa_per_sample = taxa_per_sample
    @threshold_filters = threshold_filters
    @pr_id_to_sample_id = HeatmapHelper.get_latest_pipeline_runs_for_samples(@samples)
  end

  def call
    top_taxons = fetch_top_taxons()
    organize_taxons_by_pr_id(top_taxons)
  end

  private

  # Note (Vince, May2023): short_read_mngs and long_read_mngs are roughly the
  # same, but have some critical differences around backgrounds. For ont_v1,
  # backgrounds are not supported for long-read, so the associated table of
  # taxon_summaries is not JOINed nor do we SELECT any columns that would come
  # from it. If/when we support backgrounds for long-read, the branching for
  # how the SQL query comes together will need to be updated.
  def fetch_top_taxons
    select_clause = select_sql_clause()
    join_background_clause = join_background_sql_clause()
    tax_level_clause = tax_level_sql_clause()
    categories_clause = category_sql_clause()
    phage_clause = phage_sql_clause()
    read_specificity_clause = read_specificity_sql_clause()

    query = "
    #{select_clause}
    FROM taxon_counts
    LEFT OUTER JOIN pipeline_runs pr ON pipeline_run_id = pr.id
    #{join_background_clause}
    WHERE
      pipeline_run_id IN (#{@pr_id_to_sample_id.keys.join(',')})
      AND genus_taxid != #{TaxonLineage::BLACKLIST_GENUS_ID}
      AND count >= #{@min_reads}
      -- We need both types of counts for threshold filters
      AND taxon_counts.count_type IN ('NT', 'NR')
      #{tax_level_clause}
      #{categories_clause}
      #{phage_clause}
      #{read_specificity_clause}"

    sort = CLIENT_FILTERING_SORT_VALUES[@workflow]

    # TODO: (gdingle): how do we protect against SQL injection?
    # The first query of a session does not work - the session variable @rank do not work, if we do not declare the variables before.
    # Although I could not find support on MySQL documentation, the first query seems to use always the undefined value instead of updating the variable.
    # Also guarantees that they are re-initialized to a value that avoids potential corner case issues from the last value from a previous query.
    ActiveRecord::Base.connection.execute("SET @rank := 0, @current_id := 0;")
    sql_results = TaxonCount.connection.select_all(
      top_n_query(
        query,
        @taxa_per_sample,
        sort[:metric],
        sort[:direction],
        threshold_filters: @threshold_filters,
        count_type: sort[:count_type]
      )
    ).to_a

    sql_results
  end

  def select_sql_clause
    count_per_million_sql = count_per_million_sql()

    if @workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
      zscore_sql = zscore_sql(count_per_million_sql)
      select_clause = "SELECT
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
        #{count_per_million_sql} AS rpm,
        #{zscore_sql} AS zscore"
    elsif @workflow == WorkflowRun::WORKFLOW[:long_read_mngs]
      # Does not contain any columns that come from taxon_summaries table.
      # See note about backgrounds and long-read above at `fetch_top_taxons`.
      select_clause = "SELECT
        pipeline_run_id,
        taxon_counts.tax_id,
        taxon_counts.count_type,
        taxon_counts.tax_level,
        genus_taxid,
        family_taxid,
        taxon_counts.name,
        superkingdom_taxid,
        is_phage,
        base_count               AS  b,
        count               AS  r,
        percent_identity    AS  percentidentity,
        alignment_length    AS  alignmentlength,
        COALESCE(e_value, #{ReportHelper::DEFAULT_SAMPLE_LOGEVALUE}) AS logevalue,
        -- First pass of ranking in SQL. Second pass in Ruby.
        #{count_per_million_sql} AS bpm"
    end
    select_clause
  end

  # short_read_mngs can pull background info, gets it from taxon_summaries.
  # The way this service is invoked, we should always have a `background_id`
  # for short-read. If we add long-read support for backgrounds in the future
  # and it requires us to tweak how this JOIN clause works, BE CAREFUL. The
  # four columns that form the JOIN's ON condition match up to a multi-column
  # index on taxon_summaries (background_id, tax_id, count_type, tax_level).
  # If you remove a column, it could majorly impact query performance since
  # taxon_summaries is a very big table in Prod. (Vince, May2023)
  def join_background_sql_clause
    if @workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
      join_background_clause = "    LEFT OUTER JOIN taxon_summaries ON
      #{@background_id.to_i}  = taxon_summaries.background_id   AND
      taxon_counts.count_type = taxon_summaries.count_type      AND
      taxon_counts.tax_level  = taxon_summaries.tax_level       AND
      taxon_counts.tax_id     = taxon_summaries.tax_id"
    end
    join_background_clause
  end

  def category_sql_clause
    if @categories.present?
      categories_clause = " AND taxon_counts.superkingdom_taxid IN (#{@categories.map { |category| ReportHelper::CATEGORIES_TAXID_BY_NAME[category] }.compact.join(',')})"
    elsif @include_phage
      # if only the Phage subcategory and no other categories were selected, we still need to fetch Phage's parent category, Viruses
      categories_clause = " AND taxon_counts.superkingdom_taxid = #{ReportHelper::CATEGORIES_TAXID_BY_NAME['Viruses']}"
    end
    return categories_clause
  end

  def phage_sql_clause
    if !@include_phage && @categories.present?
      # explicitly filter out phages
      phage_clause = " AND taxon_counts.is_phage != 1"
    elsif @include_phage && @categories.blank?
      # only fetch phages
      phage_clause = " AND taxon_counts.is_phage = 1"
    end
    return phage_clause
  end

  def read_specificity_sql_clause
    if @read_specificity
      read_specificity_clause = " AND taxon_counts.tax_id > 0"
    end
    read_specificity_clause
  end

  def tax_level_sql_clause
    tax_level_clause = " AND taxon_counts.tax_level IN ('#{TaxonCount::TAX_LEVEL_SPECIES}', '#{TaxonCount::TAX_LEVEL_GENUS}')"
    if @taxon_level
      if @taxon_level == TaxonCount::TAX_LEVEL_SPECIES
        tax_level_clause = " AND taxon_counts.tax_level IN ('#{TaxonCount::TAX_LEVEL_SPECIES}')"
      elsif @taxon_level == TaxonCount::TAX_LEVEL_GENUS
        tax_level_clause = " AND taxon_counts.tax_level IN ('#{TaxonCount::TAX_LEVEL_GENUS}')"
      end
    end
    return tax_level_clause
  end

  def count_per_million_sql
    if @workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
      # fraction_subsampled was introduced 2018-03-30. For prior runs, we assume
      # fraction_subsampled = 1.0.
      # The total_ercc_reads can be nil, which we interpret as 0.
      rpm_sql = "count / (
            (total_reads - COALESCE(total_ercc_reads, 0)) *
            COALESCE(fraction_subsampled, 1.0)
          ) * 1000 * 1000"
      count_per_million_sql = rpm_sql
    elsif @workflow == WorkflowRun::WORKFLOW[:long_read_mngs]
      bpm_sql = "base_count / (
            total_bases * fraction_subsampled_bases
          ) * 1000 * 1000"
      count_per_million_sql = bpm_sql
    end
    count_per_million_sql
  end

  def zscore_sql(count_per_million_sql)
    standard_z_score_sql = "(#{count_per_million_sql} - mean) / stdev"
    mass_normalized_zscore_sql = "((count/total_ercc_reads) - mean_mass_normalized) / stdev_mass_normalized"
    "COALESCE(
      GREATEST(#{ReportHelper::ZSCORE_MIN}, LEAST(#{ReportHelper::ZSCORE_MAX},
        IF(mean_mass_normalized IS NULL, #{standard_z_score_sql}, #{mass_normalized_zscore_sql})
      )),
      #{ReportHelper::ZSCORE_WHEN_ABSENT_FROM_BACKGROUND})"
  end

  # This query:
  # 1) assigns a rank to each row within a pipeline run
  # 2) returns rows ranking <= num_results
  # See http://www.sqlines.com/mysql/how-to/get_top_n_each_group
  def top_n_query(
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
          @rank := IF(@current_id = pipeline_run_id, @rank + 1, 1) AS `rank`,
          @current_id := pipeline_run_id AS current_id,
          x.*
        FROM (
          #{query}
        ) x
        ORDER BY
          pipeline_run_id,
          #{count_type_order_clause}
          #{sort_field} #{sort_direction == 'highest' ? 'DESC' : 'ASC'}
      ) y
      WHERE `rank` <= #{num_results}
    "
  end

  def organize_taxons_by_pr_id(sql_results)
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
          "sample_id" => @pr_id_to_sample_id[pipeline_run_id],
        }
      end

      include_taxon_counts = (@workflow == WorkflowRun::WORKFLOW[:short_read_mngs] && pr.total_reads) || (@workflow == WorkflowRun::WORKFLOW[:long_read_mngs] && pr.total_bases)

      if include_taxon_counts
        if @workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
          z_max = ReportHelper::ZSCORE_MAX
          z_min = ReportHelper::ZSCORE_MIN
          row["zscore"] = z_max if row["zscore"] > z_max &&
                                   row["zscore"] != ReportHelper::ZSCORE_WHEN_ABSENT_FROM_BACKGROUND
          row["zscore"] = z_min if row["zscore"] < z_min
        end
        result_hash[pipeline_run_id]["taxon_counts"] << row
      end
    end
    result_hash
  end
end
