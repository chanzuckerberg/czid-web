module ReportHelper
  def external_report_info(report, view_level, params)
    data = {}
    data[:report_details] = report_details(report)
    htc, td = taxonomy_details(report, params, view_level_name2int(view_level))
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
  def taxonomy_details(report, params, view_level_int)
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

    htc = highest_tax_counts(taxon_zscores)

    default_sort_by = 'highest_species_nt_zscore'
    sort_by = params[:sort_by] || default_sort_by
    parts = sort_by.split "_"
    if parts.length == 2
      # handle previous frontend version
      parts = [parts[0], 'species', 'nt', parts[1]]
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

    sortable = []
    unsortable = []

    tax_id_set.each do |tax_id|
      next unless level[tax_id] == view_level_int && tax_id >= 0

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

      if details[:sort_key]
        sortable.push(details)
      else
        unsortable.push(details)
      end
    end

    sortable.sort! { |dl, dr| dl[:sort_key] <=> dr[:sort_key] }
    # HACK: -- the UI gets really slow if we return all results
    # about 2000 results is what keeps it snappy, for now
    [htc, (sortable + unsortable)[0...2000]]
  end

  def resolve_params(params, data_ranges)
    new_params = {}
    [:nt_zscore_threshold, :nt_rpm_threshold].each do |k|
      s, e = params[k] ? params[k].split(',') : []
      ntnr, metric, _threshold = k.to_s.split "_"
      dr_s = data_ranges[('lowest_' + ntnr + "_" + metric).to_sym]
      dr_e = data_ranges[('highest_' + ntnr + "_" + metric).to_sym]
      new_params[k] = {
        start: Float(s || dr_s),
        end: Float(e || dr_e)
      }
    end
    new_params
  end

  def highest_tax_counts(taxon_zscores)
    hit = taxon_zscores.group_by { |h| h[:hit_type] }
    nt = hit['NT'] || []
    nr = hit['NR'] || []
    nt_z = nt.map { |h| h[:zscore] }.sort
    nr_z = nr.map { |h| h[:zscore] }.sort
    nt_rpm = nt.map { |h| h[:rpm] }.sort
    nr_rpm = nr.map { |h| h[:rpm] }.sort
    # TODO: add species/genus field
    # e.g. instaed of lowest_nt_zscore it should say
    # lowest_species_nt_zscore and lowest_genus_nt_zscore
    {
      # if you change keys here, update data_ranges[...] in resolve_params(...)
      lowest_nt_zscore: nt_z[0] || 0,
      lowest_nr_zscore: nr_z[0] || 0,
      lowest_nt_rpm: nt_rpm[0] || 0,
      lowest_nr_rpm: nr_rpm[0] || 0,
      highest_nt_zscore: nt_z[-1] || 0,
      highest_nr_zscore: nr_z[-1] || 0,
      highest_nt_rpm: nt_rpm[-1] || 0,
      highest_nr_rpm: nr_rpm[-1] || 0
    }
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
