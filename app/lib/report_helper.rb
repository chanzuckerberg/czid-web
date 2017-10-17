module ReportHelper
  def external_report_info(report, view_level, params)
    data = {}
    data[:report_details] = report_details(report)
    htc, td = taxonomy_details(report, params, view_level)
    data[:highest_tax_counts] = htc
    data[:taxonomy_details] = td
    data[:view_level] = view_level
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

  def view_level_name2int(view_level)
    case view_level.downcase
    when 'species'
      TaxonCount::TAX_LEVEL_SPECIES
    when 'genus'
      TaxonCount::TAX_LEVEL_GENUS
    end
    # to be extended for all taxonomic ranks when needed
  end

  def compute_taxon_zscores(report)
    summary = TaxonSummary.connection.select_all("select * from taxon_summaries where background_id = #{report.background.id}").to_hash
    total_reads = report.pipeline_output.total_reads
    pipeline_output_id = report.pipeline_output.id
    data = TaxonCount.connection.select_all("select tax_id, pipeline_output_id, tax_level, count, count_type from taxon_counts where pipeline_output_id = #{pipeline_output_id}").to_hash

    # pad cases where only one of NT/NR is present with zeroes
    taxid_counttype = data.group_by { |h| [h["tax_id"], h["count_type"]] }
    tax_id_set = Set.new(data.map { |h| h["tax_id"] })
    tax_id_set.each do |taxid|
      nt_ele = taxid_counttype[[taxid, 'NT']]
      nr_ele = taxid_counttype[[taxid, 'NR']]
      if nt_ele && !nr_ele
        nr_ele_new = nt_ele[0].clone
        nr_ele_new["count_type"] = 'NR'
        nr_ele_new["count"] = 0
        data << nr_ele_new
      elsif !nt_ele && nr_ele
        nt_ele_new = nr_ele[0].clone
        nt_ele_new["count_type"] = 'NT'
        nt_ele_new["count"] = 0
        data << nt_ele_new
      end
    end

    data.each do |h|
      h[:rpm] = compute_rpm(h["count"], total_reads)
    end
    data_and_background = (data + summary).group_by { |h| [h["tax_id"], h["tax_level"], h["count_type"]] }.map { |_k, v| v.reduce(:merge) }.reject { |h| h["count"].nil? }
    zscore_array = data_and_background.map { |h| { tax_id: h["tax_id"], tax_level: h["tax_level"], count: h["count"], rpm: h[:rpm], hit_type: h["count_type"], zscore: compute_zscore(h[:rpm], h[:mean], h[:stdev]) } }
    zscore_array
  end

  # rubocop:disable Metrics/AbcSize
  def taxonomy_details(report, params, view_level)
    taxon_zscores = compute_taxon_zscores(report)

    tax_id_set = Set.new(taxon_zscores.map { |h| h[:tax_id] }).delete(nil)
    if !tax_id_set.empty?
      tax_ids_str = tax_id_set.sort.join(",")
      lineage_arr = TaxonLineage.connection.select_all("SELECT taxid, superkingdom_taxid,  genus_taxid FROM taxon_lineages WHERE taxid IN (#{tax_ids_str})").to_hash
      lineage_info = lineage_arr.group_by { |h| h['taxid'] }
      name_arr = TaxonName.connection.select_all("SELECT taxid, name FROM taxon_names WHERE taxid IN (#{tax_ids_str})").to_hash
      name_info = name_arr.group_by { |h| h['taxid'] }
    else
      lineage_info = {}
      name_info = {}
    end

    # So apparently every tax_id has a unique tax_level, species or genus.
    # genus_level = TaxonCount::TAX_LEVEL_GENUS
    species_level = TaxonCount::TAX_LEVEL_SPECIES
    level = {}
    taxon_zscores.each do |h|
      level[h[:tax_id]] = h[:tax_level]
      ninfo = name_info[h[:tax_id]] || [{}]
      ninfo = ninfo.first
      h[:name] = ninfo["name"]
    end

    cat_id_set = Set.new(lineage_info.map { |_, taxons| taxons[0]['superkingdom_taxid'] }).delete(nil)
    if !cat_id_set.empty?
      category_taxids = cat_id_set.sort.join(",")
      taxon_name_arr = TaxonLineage.connection.select_all("select taxid, name from taxon_names where taxid in (#{category_taxids})").to_hash
      cat_name_info = taxon_name_arr.group_by { |h| h['taxid'] }
    else
      cat_name_info = {}
    end

    view_level_int = view_level_name2int(view_level)
    view_level_sym = view_level.downcase.to_sym
    view_level_str = view_level.downcase

    default_sort_by = 'highest_species_nt_zscore'
    sort_by = params[:sort_by] || default_sort_by
    parts = sort_by.split "_"
    if parts.length == 2
      # handle previous frontend version
      parts = [parts[0], view_level_str, 'nt', parts[1]]
    end
    if parts.length != 4
      # this is for general malformed parameter
      parts = default_sort_by.split "_"
    end
    sort_direction, sort_tax_level, sort_hit_type, sort_field = parts.map(&:to_sym)
    details_key = {
      [:species, :nt] => :nt_ele,
      [:species, :nr] => :nr_ele,
      [:genus, :nt] => :genus_nt_ele,
      [:genus, :nr] => :genus_nr_ele
    }
    sort_details_key = details_key[[sort_tax_level, sort_hit_type]]

    tax_id_set = Set.new(taxon_zscores.map { |h| h[:tax_id] })

    tax_hit = taxon_zscores.group_by { |h| [h[:tax_id], h[:hit_type]] }

    # filter and sort the nt_scores
    htc = highest_tax_counts(taxon_zscores, view_level_str)
    rp = resolve_params(params, view_level_str, htc)

    sortable = []
    unsortable = []

    tax_id_set.each do |tax_id|
      next unless tax_id >= 0 && level[tax_id] == view_level_int

      linfo = lineage_info[tax_id] || [{}]
      linfo = linfo.first

      category_taxid = linfo["superkingdom_taxid"]
      category_info = cat_name_info[category_taxid]
      category_name = category_info ? category_info[0]['name'] : 'Other'

      taxon_nts = tax_hit[[tax_id, 'NT']] || [nil]
      taxon_nrs = tax_hit[[tax_id, 'NR']] || [nil]

      if level[tax_id] == species_level
        species_nts = taxon_nts
        species_nrs = taxon_nrs
        genus_taxid = linfo["genus_taxid"]
        genus_nts = tax_hit[[genus_taxid, 'NT']] || [nil]
        genus_nrs = tax_hit[[genus_taxid, 'NR']] || [nil]
      else
        # assert level[tax_id] == genus_level
        species_nts = [nil]
        species_nrs = [nil]
        genus_nts = taxon_nts
        genus_nrs = taxon_nrs
      end

      details = {
        nt_ele: species_nts[0],
        nr_ele: species_nrs[0],
        category: category_name,
        genus_nt_ele: genus_nts[0],
        genus_nr_ele: genus_nrs[0]
      }

      # For now we sort by species RPM or Z
      # TODO: Allow sorting by genus RPM or Z
      sort_details = details[sort_details_key]
      if sort_details
        sort_key = sort_details[sort_field]
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
          fm_val = filter_details[metric]
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
    # about 2000 results is what keeps it snappy, for now
    [htc, (sortable + unsortable)[0...2000]]
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

  def highest_tax_counts(taxon_zscores, view_level_str)
    # compute min/max extents for 8 columns
    bounds = {}
    taxon_zscores.each do |taxon|
      level = taxon[:tax_level] == TaxonCount::TAX_LEVEL_SPECIES ? :species : :genus
      type = taxon[:hit_type] == 'NT' ? :nt : :nr
      [:zscore, :rpm].each do |metric|
        tm_val = taxon[metric]
        high = [:highest, level, type, metric]
        bounds[high] = tm_val unless bounds[high] && bounds[high] > tm_val
        low = [:lowest, level, type, metric]
        bounds[low] = tm_val unless bounds[low] && bounds[low] < tm_val
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

  def compute_rpm(count, total_reads)
    if count
      count * 1e6 / total_reads.to_f
    else
      0
    end
  end

  def clamp(z)
    if z < -99
      -99
    elsif z > 99
      99
    else
      z
    end
  end

  def compute_zscore(rpm, mean, stdev)
    valid_stdev = !(stdev.nil? || stdev.zero?)
    if rpm && valid_stdev
      clamp((rpm - mean) / stdev)
    elsif rpm && rpm != 0 && !valid_stdev
      100
    else
      0
    end
  end
end
