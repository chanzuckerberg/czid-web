module ReportHelper
  ZSCORE_MIN = -99
  ZSCORE_MAX =  99
  ZSCORE_WHEN_ABSENT_FROM_SAMPLE = -100
  ZSCORE_WHEN_ABSENT_FROM_BACKGROUND = 100

  def external_report_info(report, view_level, params)
    data = {}
    data[:report_details] = report_details(report)
    htc, td = taxonomy_details(report, params, view_level)
    data[:highest_tax_counts] = htc
    data[:taxonomy_details] = td
    data[:view_level] = view_level
    data[:all_categories] = all_categories
    if params[:categories]
      data[:checked_categories] = params[:categories].split(',').map { |c| { taxid: c.to_i } }
    end
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

  def get_raw_taxon_counts(report, categories)
    pipeline_output_id = report.pipeline_output.id
    total_reads = report.pipeline_output.total_reads
    background_id = report.background.id
    # Note: stdev is never 0
    # To do: handle absence of percent_identity, alignment_length, e_value
    #        in view of filtering on them
    query_results = TaxonCount.select("
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
      taxon_counts.count               AS  count,
      (count / #{total_reads}.0
        * 1000000.0)                   AS  rpm,
      taxon_counts.percent_identity    AS  percent_identity,
      taxon_counts.alignment_length    AS  alignment_length,
      taxon_counts.e_value             AS  e_value,
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
    )

    if categories.present?
      query_results = query_results.where("taxon_lineages.superkingdom_taxid in (#{categories})")
    end

    query_results.to_a.map(&:attributes)
  end

  def flip_type(t)
    t == 'NR' ? 'NT' : 'NR'
  end

  def zero_twin(taxon)
    result = taxon.clone
    result['count'] = 0
    result['rpm'] = 0
    result['count_type'] = flip_type(result['count_type'])
    result['zscore'] = ZSCORE_WHEN_ABSENT_FROM_SAMPLE
    result['percent_identity'] = 0
    result['alignment_length'] = 0
    result['e_value'] = 0
    result
  end

  def sort_params(params_sort_by, view_level_str, details_key)
    default_sort_by = 'highest_species_nt_zscore'
    sort_by = params_sort_by || default_sort_by
    parts = sort_by.split "_"
    if parts.length == 2
      # handle previous frontend version
      parts = [parts[0], view_level_str, 'nt', parts[1]]
    end
    if parts.length != 4
      # this is for general malformed parameter
      parts = default_sort_by.split "_"
    end
    sort_direction, sort_tax_level, sort_count_type, sort_field = parts.map(&:to_sym)
    sort_details_key = details_key[[sort_tax_level, sort_count_type]]
    [sort_field, sort_details_key, sort_direction]
  end

  def get_taxon_counts_2d(report, categories)
    taxon_counts_from_sql = get_raw_taxon_counts(report, categories)
    taxon_counts_2d = {}
    taxon_counts_from_sql.each do |taxon|
      tax_id = taxon['tax_id']
      count_type = taxon['count_type']
      taxon_counts_2d[tax_id] ||= {}
      taxon_counts_2d[tax_id][count_type] = taxon
    end
    taxon_counts_2d.each do |_tax_id, tax_pair|
      tax_pair['NT'] ||= zero_twin(tax_pair['NR'])
      tax_pair['NR'] ||= zero_twin(tax_pair['NT'])
    end
    taxon_counts_2d
  end

  def taxonomy_details(report, params, view_level)
    tax2d = get_taxon_counts_2d(report, params[:categories])

    view_level_int = view_level_name2int(view_level)
    view_level_str = view_level.downcase
    view_level_sym = view_level_str.to_sym

    details_key = {
      [:species, :nt] => :nt_ele,
      [:species, :nr] => :nr_ele,
      [:genus, :nt] => :genus_nt_ele,
      [:genus, :nr] => :genus_nr_ele
    }
    sort_field, sort_details_key, sort_direction = sort_params(params[:sort_by], view_level_str, details_key)

    htc = highest_tax_counts(tax2d, view_level_str)
    rp = resolve_params(params, view_level_str, htc)

    sortable = []
    unsortable = []

    tax2d.each do |tax_id, tax_pair|
      next unless tax_id >= 0 && tax_pair['NT']['tax_level'] == view_level_int

      if view_level_int == TaxonCount::TAX_LEVEL_SPECIES
        genus_taxid = tax_pair['NT']['genus_taxid']
        # the genus_taxid should always be present in tax2d
        # but sometimes it isn't... possibly due to a bug
        details = {
          nt_ele: tax_pair['NT'],
          nr_ele: tax_pair['NR'],
          category: tax_pair['NT']['category_name'],
          genus_nt_ele: tax2d.fetch(genus_taxid, {})['NT'],
          genus_nr_ele: tax2d.fetch(genus_taxid, {})['NR']
        }
      else
        details = {
          nt_ele: nil,
          nr_ele: nil,
          category: tax_pair['NT']['category_name'],
          genus_nt_ele: tax_pair['NT'],
          genus_nr_ele: tax_pair['NR']
        }
      end

      # For now we sort by species RPM or Z
      # TODO: Allow sorting by genus RPM or Z
      sort_details = details[sort_details_key]
      sort_field_str = sort_field.to_s
      if sort_details
        sort_key = sort_details[sort_field_str]
        if sort_key
          sort_key = 0.0 - sort_key if sort_direction == :highest
          details[:sort_key] = sort_key
        end
      end

      out_of_bounds = false
      [:nt, :nr].each do |type|
        filter_details = details[details_key[[view_level_sym, type]]]
        next unless filter_details
        [:zscore, :rpm].each do |metric|
          fm_val = filter_details[metric.to_s]
          high = "highest_#{view_level_str}_#{type}_#{metric}".to_sym
          if rp[high] < fm_val
            out_of_bounds = true
            break
          end
          low = "lowest_#{view_level_str}_#{type}_#{metric}".to_sym
          if rp[low] > fm_val
            out_of_bounds = true
            break
          end
        end
        break if out_of_bounds
      end

      unless out_of_bounds
        if details[:sort_key]
          sortable.push(details)
        else
          unsortable.push(details)
        end
      end
    end

    sortable.sort! { |dl, dr| dl[:sort_key] <=> dr[:sort_key] }
    # HACK: -- the UI gets really slow if we return all results
    # about 1000 results is what keeps it super snappy for now
    rows = (sortable + unsortable)[0...1000]
    [htc, rows]
  end

  def resolve_params(params, view_level_str, data_ranges)
    new_params = data_ranges.clone
    [:species_nt_zscore_threshold,
     :species_nt_rpm_threshold,
     :species_nr_zscore_threshold,
     :species_nr_rpm_threshold,
     :genus_nt_zscore_threshold,
     :genus_nt_rpm_threshold,
     :genus_nr_zscore_threshold,
     :genus_nr_rpm_threshold,
     :nt_zscore_threshold,
     :nt_rpm_threshold,
     :nr_zscore_threshold,
     :nr_rpm_threshold].each do |k|
      level_type_metric = k.to_s.chomp('_threshold')
      if level_type_metric.split("_").length < 3
        level_type_metric = "#{view_level_str}_#{level_type_metric}".to_sym
      end
      high = "highest_#{level_type_metric}".to_sym
      low = "lowest_#{level_type_metric}".to_sym
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

  def highest_tax_counts(taxon_counts_2d, view_level_str)
    # compute min/max extents for 8 columns
    bounds = {}
    taxon_counts_2d.each do |_tax_id, tax_pair|
      tax_pair.each do |_count_type, taxon|
        level = taxon['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES ? :species : :genus
        type = taxon['count_type'] == 'NT' ? :nt : :nr
        [:zscore, :rpm].each do |metric|
          tm_val = taxon[metric.to_s]
          high = [:highest, level, type, metric]
          bounds[high] = tm_val unless bounds[high] && bounds[high] > tm_val
          low = [:lowest, level, type, metric]
          bounds[low] = tm_val unless bounds[low] && bounds[low] < tm_val
        end
      end
    end
    # flatten & handle empty columns
    flat = {}
    default_value = 0
    [:highest, :lowest].each do |extent|
      [:species, :genus].each do |level|
        [:nt, :nr].each do |type|
          [:zscore, :rpm].each do |metric|
            key_l = [extent, level, type, metric]
            key_s = "#{extent}_#{level}_#{type}_#{metric}".to_sym
            flat[key_s] = bounds.delete(key_l) || default_value
            # For now, JS likes to get the extents of the chosen view_level
            # without express view_level qualification
            if level != view_level_str.to_sym
              key_ui = "#{extent}_#{type}_#{metric}".to_sym
              flat[key_ui] = flat[key_s]
            end
          end
        end
      end
    end
    logger.warn "Ignoring taxon extents key #{bounds}" unless bounds.empty?
    flat
  end
end
