module ReportHelper
  ZSCORE_MIN = -99
  ZSCORE_MAX =  99
  ZSCORE_WHEN_ABSENT_FROM_SAMPLE = -100
  ZSCORE_WHEN_ABSENT_FROM_BACKGROUND = 100

  # TODO: For taxons that have no entry in the taxon_lineages table, we should
  # substitute this value for genus_id, which allows us to group them
  # all together;  this should match generate_aggregate_counts in
  # app/models/pipeline_output.rb
  MISSING_GENUS_ID = -200
  MISSING_SPECIES_ID = -100
  MISSING_SPECIES_ID_ALT = -1

  # For taxon_count 'species' rows without a corresponding 'genus' rows,
  # we create a fake singleton genus containing just that species;
  # the fake genus IDs start here:
  FAKE_GENUS_BASE = -1900000000

  DECIMALS = 1

  DEFAULT_PARAMS = {
    view_level:       'genus',
    sort_by:          'highest_nt_zscore',
    threshold_zscore: 1.7,
    threshold_rpm:    1.0,
    threshold_r:      50
  }

  VIEW_LEVELS = ['species', 'genus']
  SORT_DIRECTIONS = ['highest', 'lowest']
  METRICS = ['r', 'rpm', 'zscore']
  COUNT_TYPES = ['NT', 'NR']
  SORT_DIRECTIONS = ['lowest', 'highest']
  PROPERTIES_OF_TAXID = ['tax_id', 'name', 'name_from_lineages', 'name_from_counts', 'tax_level', 'genus_taxid', 'category_name']
  UNUSED_IN_UI_FIELDS = ['genus_taxid', :sort_key]

  def is_threshold_param(param_key)
    parts = param_key.to_s.split "_"
    return (parts.length == 2 && parts[0] == 'threshold' && METRICS.include?(parts[1]))
  end

  def decode_thresholds(params)
    thresholds = {}
    METRICS.each do |metric|
      param_key = "threshold_#{metric}".to_sym
      thresholds[metric] = params[param_key]
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

  def valid_arg_value(name, value)
    # return appropriately validated value (based on name), or nil
    return nil unless value
    if name == :view_level
      value = value.downcase
      value = nil unless VIEW_LEVELS.include? value
    elsif name == :sort_by
      value = nil unless decode_sort_by(value)
    else
      value = nil unless is_threshold_param(name)
      value = number_or_nil(value)
    end
    return value
  end

  def clean_params(raw)
    clean = {}
    raw_hash = {}
    raw.each do |name, value|
      raw_hash[name] = value
    end
    raw = raw_hash
    DEFAULT_PARAMS.each do |name, default_value|
      clean[name] = valid_arg_value(name, raw[name.to_s]) || default_value
      raw.delete(name)
    end
    logger.warn "Ignoring #{raw.length} report params: #{raw}."
    clean
  end

  def external_report_info(report, params)
    return {} if report.nil?
    params = clean_params(params)
    data = {}
    data[:report_page_params] = params
    data[:report_details] = report_details(report)
    data[:taxonomy_details] = taxonomy_details(report, params)
    data[:all_categories] = all_categories
    # puts "BORIS RETURNING #{data[:report_page_params]}"
    # assert false
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

  def fetch_taxon_counts(report)
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
      )                                AS  name_from_lineages,
      taxon_counts.name                AS  name_from_counts,
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
      metric_props[metric] = taxon[metric].round(DECIMALS)
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
    fake_genus_info['name'] = "#{tax_info['name']} fake genus"
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
    #       species_count,
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
    taxon_counts_from_sql.each do |t|
      taxon_counts_2d[t['tax_id']] ||= tax_info_base(t)
      taxon_counts_2d[t['tax_id']][t['count_type']] = metric_props(t)
    end
    taxon_counts_2d
  end

  def cleanup_genus_ids!(taxon_counts_2d)
    # We might rewrite the query to be super sure of this
    taxon_counts_2d.each do |tax_id, tax_info|
      if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_GENUS
        tax_info['genus_taxid'] = tax_id
      end
    end
    taxon_counts_2d
  end

  def cleanup_names!(taxon_counts_2d)
    # There are still taxons without names
    missing_names = Set.new
    taxon_counts_2d.each do |tax_id, tax_info|
      name_from_lineages = tax_info.delete('name_from_lineages')
      name_from_counts = tax_info.delete('name_from_counts')
      if tax_id < 0
        # Usually -1 means accession number did not resolve to species.
        # TODO: Can we keep the accession numbers to show in these cases?
        level_str = tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES ? 'species' : 'genuses'
        tax_info['name'] = "All uncategorized #{level_str}"
        if tax_id != MISSING_SPECIES_ID && tax_id != MISSING_SPECIES_ID_ALT && tax_id != MISSING_GENUS_ID
          tax_info['name'] += " #{tax_id}"
        end
      else
        missing_names.add(tax_id) unless name_from_lineages
        tax_info['name'] = (
          name_from_lineages ||
          name_from_counts ||
          "Unnamed taxon #{tax_id}"
        )
      end
      tax_info['category_name'] ||= 'Uncategorized'
    end
    logger.warn "Missing taxon_lineages names for taxon ids #{missing_names.to_a}" unless missing_names.empty?
    taxon_counts_2d
  end

  def cleanup_missing_genus_counts!(taxon_counts_2d)
    # there should be a genus_pair for every species (even if it is the pseudo
    # genus id -200);  anything else indicates a bug in data import;
    # warn and ensure affected data is NOT hidden from view
    fake_genuses = []
    missing_genuses = Set.new
    taxids_with_missing_genuses = Set.new
    taxon_counts_2d.each do |tax_id, tax_info|
      genus_taxid = tax_info['genus_taxid']
      unless taxon_counts_2d[genus_taxid]
        taxids_with_missing_genuses.add(tax_id)
        missing_genuses.add(genus_taxid)
        fake_genuses << fake_genus!(tax_info)
      end
    end
    logger.warn "Missing taxon_counts for genus ids #{missing_genuses.to_a} corresponding to taxon ids #{taxids_with_missing_genuses.to_a}." unless missing_genuses.empty?
    fake_genuses.each do |fake_genus_info|
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

  def cleanup_all!(taxon_counts_2d)
    t0 = Time.now
    cleanup_genus_ids!(taxon_counts_2d)
    cleanup_names!(taxon_counts_2d)
    cleanup_missing_genus_counts!(taxon_counts_2d)
    t1 = Time.now
    logger.info "Data cleanup took #{t1 - t0} seconds."
    taxon_counts_2d
  end

  def negative(vec_10d)
    vec_10d.map {|x| -x}
  end

  def sort_key(tax_2d, tax_info, sort_by)
    # sort by (genus, species) in the chosen metric, making sure that
    # the genus comes before its species in either sort direction;
    # use the metric's NT <=> NR dual as a tertiary sort key (so, for example,
    # when you sort by NT R, entries without NT R will be ordered amongst
    # themselves based on their NR R (as opposed to arbitrary ordder);
    # and within the Z, for things with equal Z, use the R as tertiary
    other_type = {
      'NT' => 'NR',
      'NR' => 'NT'
    }
    COUNT_TYPES.each do |count_type|
      # may be should warn when this fires
      other_type[count_type] ||= count_type
    end
    other_metric = {
      'zscore' => 'r',
      'r' => 'zscore',
      'rpm' => 'zscore'
    }
    METRICS.each do |metric|
      # may be should warn when this fires
      other_metric[metric] ||= metric
    end
    genus_id = tax_info['genus_taxid']
    genus_info = tax_2d[genus_id]
    # this got a lot longer after it became clear that we want other_type and other_metric
    # TODO: refactor
    sort_key_genus = genus_info[sort_by[:count_type]][sort_by[:metric]]
    sort_key_genus_alt = genus_info[other_type[sort_by[:count_type]]][sort_by[:metric]]
    sort_key_genus_om = genus_info[sort_by[:count_type]][other_metric[sort_by[:metric]]]
    sort_key_genus_om_alt = genus_info[other_type[sort_by[:count_type]]][other_metric[sort_by[:metric]]]
    if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
      sort_key_species = tax_info[sort_by[:count_type]][sort_by[:metric]]
      sort_key_species_alt = tax_info[other_type[sort_by[:count_type]]][sort_by[:metric]]
      sort_key_species_om = tax_info[sort_by[:count_type]][other_metric[sort_by[:metric]]]
      sort_key_species_om_alt = tax_info[other_type[sort_by[:count_type]]][other_metric[sort_by[:metric]]]
      # sort_key_3d = [sort_key_genus, sort_key_genus_alt, sort_key_genus_om, sort_key_genus_om_alt, genus_id, 0, sort_key_species, sort_key_species_alt, sort_key_species_om, sort_key_species_om_alt]
      sort_key_3d = [sort_key_genus, sort_key_genus_om, sort_key_genus_alt, sort_key_genus_om_alt, genus_id, 0, sort_key_species, sort_key_species_om, sort_key_species_alt, sort_key_species_om_alt]
    else
      genus_priority = sort_by[:direction] == 'highest' ? 1 : -1
      # sort_key_3d = [sort_key_genus, sort_key_genus_alt, sort_key_genus_om, sort_key_genus_om_alt, genus_id, genus_priority, 0, 0, 0, 0]
      sort_key_3d = [sort_key_genus, sort_key_genus_om, sort_key_genus_alt, sort_key_genus_om_alt, genus_id, genus_priority, 0, 0, 0, 0]
    end
    sort_by[:direction] == 'lowest' ? sort_key_3d : negative(sort_key_3d)
  end

  def filter_rows!(rows, thresholds, sort_by)
    # filter out rows that are below the thresholds in both NR and NT
    # but make sure not to delete any genus row for which some species
    # passes the filters
    to_delete = Set.new
    to_keep = Set.new
    rows.each do |tax_info|
      should_delete = false
      # if sort column is below threshold, delete
      if tax_info[sort_by[:count_type]][sort_by[:metric]] < thresholds[sort_by[:metric]]
        should_delete = true
      else
        # if any metric is below threshold in every type, delete
        METRICS.each do |metric|
          should_delete = COUNT_TYPES.all? {|count_type| tax_info[count_type][metric] < thresholds[metric]}
          break if should_delete
        end
      end
      if should_delete
        to_delete.add(tax_info['tax_id'])
      else
        # if we are not deleteing it, make sure to keep around its genus
        to_keep.add(tax_info['genus_taxid'])
      end
    end
    # it's good to always include that genus-level bucket of uncategorized species
    # as a sort of "all others" category
    to_keep.add(-200)
    to_delete.subtract(to_keep)
    rows.keep_if {|tax_info| !to_delete.include?tax_info['tax_id'] }
    rows
  end

  def taxonomy_details(report, params)

    view_level = params[:view_level]
    view_level_int = TaxonCount::NAME_2_LEVEL[view_level.downcase]
    sort_by = decode_sort_by(params[:sort_by])
    thresholds = decode_thresholds(params)

    t0 = Time.now
    tax_2d = cleanup_all!(convert_2d(fetch_taxon_counts(report)))
    t1 = Time.now

    count_species_per_genus!(tax_2d)

    rows = []
    tax_2d.each do |_tax_id, tax_info|
      next unless tax_info['tax_level'] >= view_level_int
      tax_info[:sort_key] = sort_key(tax_2d, tax_info, sort_by)
      rows << tax_info
    end
    rows.sort! { |dl, dr| dl[:sort_key] <=> dr[:sort_key] }

    filter_rows!(rows, thresholds, sort_by)

    real_length = rows.length
    # logger.info "Report contains #{rows.length} rows after filtering."

    # HACK keep at most 2,000 rows
    rows = rows[0...4000]

    rows.each do |tax_info|
      UNUSED_IN_UI_FIELDS.each do |unused_field|
        tax_info.delete(unused_field)
      end
    end

    t2 = Time.now
    logger.info "Data processing took #{t2 - t1} seconds (#{t2 - t0} with I/O)."

    [real_length, rows]
  end

end
