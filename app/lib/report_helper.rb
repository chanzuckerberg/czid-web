module ReportHelper
  def external_report_info(report, view_level, params)
    data = {}
    data[:report_details] = report_details(report)
    htc, td = taxonomy_details(report, params)
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

  def compute_taxon_zscores(report)
    summary = report.background.summarize
    total_reads = report.pipeline_output.total_reads
    pipeline_output_id = report.pipeline_output.id
    data = TaxonCount.connection.select_all("select tax_id, pipeline_output_id, tax_level, count, name, count_type from taxon_counts where pipeline_output_id = #{pipeline_output_id}").to_hash
    data.each do |h|
      h[:rpm] = compute_rpm(h["count"], total_reads)
    end
    data_and_background = (data + summary).group_by { |h| [h["tax_id"], h["tax_level"], h["name"], h["count_type"]] }.map { |_k, v| v.reduce(:merge) }.select { |h| h["count"] }
    zscore_array = data_and_background.map { |h| { tax_id: h["tax_id"], tax_level: h["tax_level"], name: h["name"], rpm: h[:rpm], hit_type: h["count_type"], zscore: compute_zscore(h[:rpm], h[:mean], h[:stdev]) } }
    zscore_array
  end

  def taxonomy_details(report, params)
    taxon_zscores = compute_taxon_zscores(report)
    genus_level = TaxonCount::TAX_LEVEL_GENUS
    species_level = TaxonCount::TAX_LEVEL_SPECIES
    tax_ids_str = ''

    taxon_zscores.each do |taxon|
      tax_ids_str += taxon[:tax_id].to_s
      tax_ids_str += ','
    end
    tax_ids_str = tax_ids_str.chomp(',')
    lineage_arr = TaxonLineage.connection.select_all("SELECT taxid, superkingdom_taxid,  genus_taxid FROM taxon_lineages WHERE taxid IN (#{tax_ids_str})").to_hash
    lineage_info = lineage_arr.group_by { |h| h['taxid'] }

    category_taxids = ''
    lineage_info.each do |_taxid, taxons|
      category_taxids += taxons[0]['superkingdom_taxid'].to_s
      category_taxids += ','
    end
    category_taxids = category_taxids.chomp(',')
    if !category_taxids.empty?
      taxon_name_arr = TaxonLineage.connection.select_all("select taxid, name from taxon_names where taxid in (#{category_taxids})").to_hash
      cat_name_info = taxon_name_arr.group_by { |h| h['taxid'] }
    else
      cat_name_info = []
    end

    data = taxon_zscores.group_by { |h| [h[:tax_level], h[:hit_type]] }
    nt = data[[species_level, 'NT']] || []
    nr = data[[species_level, 'NR']] || []

    nt_genus = data[[genus_level, 'NT']] || []
    nr_genus = data[[genus_level, 'NT']] || []
    genus_nt_nr = nt_genus.concat nr_genus

    # filter and sort the nt_scores
    htc = highest_tax_counts(nt, nr)
    rp = resolve_params(params, htc)
    nt_nr = nt.concat nr

    nt_nr.keep_if do |h|
      (h[:tax_id] >= 0 &&
        h[:zscore] >= rp[:nt_zscore_threshold][:start] &&
        h[:zscore] <= rp[:nt_zscore_threshold][:end] &&
        h[:rpm] >= rp[:nt_rpm_threshold][:start] &&
        h[:rpm] <= rp[:nt_rpm_threshold][:end]
      )
    end
    sort_report!(nt_nr, params[:sort_by])
    tax_details = []
    nt_nr.each do |h|
      category_taxid = lineage_info[h[:tax_id]][0]["superkingdom_taxid"]
      # p 'The taxid = ', category_taxid, taxon_name_info

      genus_taxid = lineage_info[h[:tax_id]] && lineage_info[h[:tax_id]][0]["genus_taxid"]
      found_genus = genus_nt_nr.select { |genus| genus[:tax_id] == genus_taxid }
      genus_nt_ele = found_genus[0]
      genus_nr_ele = found_genus[1]

      category_info = cat_name_info[category_taxid]
      category_name = category_info ? category_info[0]['name'] : 'Other'

      nt_ele = h[:hit_type] == 'NT' ? h : nil
      nr_ele = h[:hit_type] == 'NR' ? h : nil

      tax_details.push(nt_ele: nt_ele, nr_ele: nr_ele,
                       category: category_name,
                       genus_nt_ele: genus_nt_ele,
                       genus_nr_ele: genus_nr_ele)
    end
    [htc, tax_details]
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

  def highest_tax_counts(nt, nr)
    nt_z = nt.map { |h| h[:zscore] }.sort
    nr_z = nr.map { |h| h[:zscore] }.sort
    nt_rpm = nt.map { |h| h[:rpm] }.sort
    nr_rpm = nr.map { |h| h[:rpm] }.sort
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

  def sort_report!(nt_zscores, sort_by)
    sort_by = 'highest_zscore' if sort_by.nil?
    sort_direction, sort_field = sort_by.split "_"
    sort_field = sort_field.to_sym
    nt_zscores.sort! { |hl, hr| hl[sort_field] <=> hr[sort_field] }
    nt_zscores.reverse! if sort_direction == 'highest'
    nt_zscores
  end

  def compute_rpm(count, total_reads)
    if count
      count * 1e6 / total_reads.to_f
    else
      0
    end
  end

  def compute_zscore(rpm, mean, stdev)
    if rpm && stdev && stdev != 0
      (rpm - mean) / stdev
    elsif rpm
      100
    else
      0
    end
  end
end
