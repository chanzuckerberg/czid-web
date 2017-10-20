module ReportHelper
  ZSCORE_MIN = -99
  ZSCORE_MAX =  99
  ZSCORE_WHEN_ABSENT_FROM_SAMPLE = -100
  ZSCORE_WHEN_ABSENT_FROM_BACKGROUND = 100
  # Only as a data cleanliness bug, there may be a taxon_count 'specoes' row
  # without a corresponding 'genus' row;  then we create a fake singleton
  # genus containing just that species;  the fake genus IDs start here:
  FAKE_GENUS_BASE = -1900000000

  def external_report_info(report, view_level, params)
    data = {}
    data[:report_details] = report_details(report)
    htc, td = taxonomy_details(report, params, view_level)
    data[:highest_tax_counts] = htc
    data[:taxonomy_details] = td
    data[:view_level] = view_level
    data[:all_categories] = all_categories
    data
  end

  def report_details(report)
    {
      report_info: report,
      pipeline_info: report.pipeline_output,
      sample_info: report.pipeline_output.sample,
      project_info: report.pipeline_output.sample.project,
      background_model: report.background
    }
  end

  def all_categories
    cat_ids = TaxonLineage.distinct.pluck(:superkingdom_taxid).join(', ')
    taxon_name_arr = []
    taxon_name_arr = TaxonName.connection.select_all("select taxid, name from taxon_names where taxid in (#{cat_ids})").to_hash unless cat_ids.empty?
    taxon_name_arr
  end

  def view_level_name2int(view_level)
    case view_level.downcase
    when 'species'
      TaxonCount::TAX_LEVEL_SPECIES
    when 'genus'
      TaxonCount::TAX_LEVEL_GENUS
    end
    # to be extended for all taxonomic ranks when needed
  end

  def get_raw_taxon_counts(report)
    pipeline_output_id = report.pipeline_output.id
    total_reads = report.pipeline_output.total_reads
    background_id = report.background.id
    # Note: stdev is never 0
    TaxonCount.select("
      taxon_counts.tax_id              AS  tax_id,
      taxon_counts.count_type          AS  count_type,
      taxon_counts.tax_level           AS  tax_level,
      taxon_lineages.genus_taxid       AS  genus_taxid,
      IF(
        taxon_counts.tax_level=#{TaxonCount::TAX_LEVEL_SPECIES},
        taxon_lineages.species_name,
        taxon_lineages.genus_name
      )                                AS  name,
      taxon_lineages.superkingdom_name AS  category_name,
      taxon_counts.count               AS  r,
      (count / #{total_reads}.0
        * 1000000.0)                   AS  rpm,
      IF(
        stdev IS NOT NULL,
        GREATEST(#{ZSCORE_MIN}, LEAST(#{ZSCORE_MAX}, (((count / #{total_reads}.0 * 1000000.0) - mean) / stdev))),
        #{ZSCORE_WHEN_ABSENT_FROM_BACKGROUND}
      )
                                       AS  zscore
    ").joins("
      LEFT OUTER JOIN taxon_summaries ON
        taxon_counts.tax_id     = taxon_summaries.tax_id          AND
        taxon_counts.count_type = taxon_summaries.count_type      AND
        taxon_counts.tax_level  = taxon_summaries.tax_level       AND
        #{background_id}        = taxon_summaries.background_id
    ").joins("
      LEFT OUTER JOIN taxon_lineages ON
        taxon_counts.tax_id = taxon_lineages.taxid
    ").where(
      pipeline_output_id: pipeline_output_id,
      count_type: %w[NT NR]
    ).to_a.map(&:attributes)
  end

  def zero_metrics(count_type)
    {
      'count_type' => count_type,
      'r' => 0,
      'rpm' => 0,
      'zscore' => ZSCORE_WHEN_ABSENT_FROM_SAMPLE
    }
  end

  def decode_sort_params(params_sort_by, default='highest_nt_zscore')
    sort_by = params_sort_by || default
    parts = sort_by.split "_"
    if parts.length != 3
      parts = default.split "_"
    end
    {
      direction:    parts[0],
      count_type:   parts[1].upcase,
      metric:       parts[2]
    }
  end

  METRICS = ['r', 'rpm', 'zscore']
  COUNT_TYPES = ['NT', 'NR']
  SORT_DIRECTIONS = ['lowest', 'highest']
  PROPERTIES_OF_TAXID = ['tax_id', 'name', 'tax_level', 'genus_taxid', 'category_name']

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
    metric_props = {
      'count_type' => taxon['count_type']
    }
    METRICS.each do |metric|
      metric_props[metric] = taxon[metric]
    end
    metric_props
  end

  def fake_genus!(tax_info)
    # Create a singleton genus containing just this taxon
    fake_genus_info = tax_info.clone
    fake_genus_id = FAKE_GENUS_BASE - tax_info['tax_id']
    fake_genus_info['tax_id'] = fake_genus_id
    fake_genus_info['genus_taxid'] = fake_genus_id
    fake_genus_info['tax_level'] = TaxonCount::TAX_LEVEL_GENUS
    tax_info['genus_taxid'] = fake_genus_id
    fake_genus_info
  end

  def get_taxon_counts_2d(report)
    # Return data structured as
    #    tax_id => {
    #       tax_id,
    #       tax_level,
    #       genus_taxid,
    #       name,
    #       category_name,
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
    taxon_counts_from_sql = get_raw_taxon_counts(report)
    taxon_counts_from_sql.each do |t|
      taxon_counts_2d[t['tax_id']] ||= tax_info_base(t)
      taxon_counts_2d[t['tax_id']][t['count_type']] = metric_props(t)
    end
    # We might rewrite the query to be super sure of this
    taxon_counts_2d.each do |tax_id, tax_info|
      if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_GENUS
        tax_info['genus_taxid'] = tax_info['tax_id']
      end
    end
    # there should be a genus_pair for every species (even if it is the pseudo
    # genus id -200);  anything else indicates a bug in data import;
    # warn about that bug and ensure affected data is NOT hidden from view
    fake_genuses = []
    taxon_counts_2d.each do |tax_id, tax_info|
      unless taxon_counts_2d[tax_info['genus_taxid']]
        logger.warn "Missing taxon_counts for genus_taxid #{tax_info['genus_taxid']} referenced by taxid #{tax_info['tax_id']}. Will 'promote' the taxon itself into singleton genus.  This may indicate a bug in the DB uploader code.  Try rerunning the sample."
        fake_genuses << fake_genus!(tax_info)
      end
    end
    fake_genuses.each do |fake_genus_info|
      taxon_counts_2d[fake_genus_info['genus_taxid']] = fake_genus_info
    end
    taxon_counts_2d
  end

  def negative(vec_3d)
    x, y, z = vec_3d
    [-x, -y, -z]
  end

  def sort_key(tax_2d, tax_info, sort_by)
    # sort by (genus, species) in the chosen metric;  making sure that
    # the genus comes before its species in either sort direction
    genus_info = tax_2d[tax_info['genus_taxid']]
    sort_key_genus = genus_info[sort_by[:count_type]][sort_by[:metric]]
    if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
      sort_key_species = tax_info[sort_by[:count_type]][sort_by[:metric]]
      sort_key_3d = [sort_key_genus, 1, sort_key_species]
    else
      sort_key_3d = [sort_key_genus, 0, 0]
    end
    sort_by[:direction] == 'lowest' ? sort_key_3d : negative(sort_key_3d)
  end

  def taxonomy_details(report, params, view_level)
    tax_2d = get_taxon_counts_2d(report)
    data_ranges = min_max(tax_2d)

    view_level_int = view_level_name2int(view_level)
    sort_by = decode_sort_params(params[:sort_by])
    rp = decode_range_params(params, data_ranges)

    rows = []
    tax_2d.each do |tax_id, tax_info|
      next unless tax_id >= 0 && tax_info['tax_level'] >= view_level_int
      tax_info[:sort_key] = sort_key(tax_2d, tax_info, sort_by)
      rows << tax_info
    end

    rows.sort! { |dl, dr| dl[:sort_key] <=> dr[:sort_key] }

    rows.each do |tax_info|
      tax_info.delete(:sort_key)
    end

    puts "BORIS: #{rows[0..10]}"

    [data_ranges, rows[0...1000]]
  end

  def decode_range_params(params, data_ranges)
    new_params = data_ranges.clone
    [:nt_zscore_threshold,
     :nt_rpm_threshold,
     :nt_r_threshold,
     :nr_zscore_threshold,
     :nr_rpm_threshold,
     :nr_r_threshold].each do |k|
      type_metric = k.to_s.chomp('_threshold')
      high = "highest_genus_#{type_metric}".to_sym
      low = "lowest_genus__#{type_metric}".to_sym
      thresholds = params[k]
      next unless thresholds
      t_low, t_high = thresholds.split(',')
      if t_low && t_high
        new_params[low] = Float(t_low)
        new_params[high] = Float(t_high)
      end
    end
    new_params
  end

  def min_max(taxon_counts_2d)
    # compute min/max extents for all genus metrics
    bounds = {}
    taxon_counts_2d.each do |_tax_id, tax_info|
      next unless tax_info['tax_level'] == TaxonCount::TAX_LEVEL_GENUS
      COUNT_TYPES.each do |count_type|
        count_bucket = tax_info[count_type]
        METRICS.each do |metric|
          val = count_bucket[metric]
          high = "highest_genus_#{count_type}_#{metric}".to_sym
          bounds[high] = val unless bounds[high] && bounds[high] > val
          low = "lowest_genus_#{count_type}_#{metric}".to_sym
          bounds[low] = val unless bounds[low] && bounds[low] < val
        end
      end
    end
    # flatten & handle empty columns
    flat = {}
    default_value = 0
    SORT_DIRECTIONS.each do |extent|
      COUNT_TYPES.each do |type|
        METRICS.each do |metric|
          key = "#{extent}_genus_#{type}_#{metric}".to_sym
          flat[key] = bounds.delete(key) || default_value
        end
      end
    end
    logger.warn "Ignoring taxon extents key #{bounds}" unless bounds.empty?
    flat
  end
end
