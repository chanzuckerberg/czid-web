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
    tax_id_set = Set.new(taxon_zscores.map { |h| h[:tax_id] })
    tax_id_set.delete(nil)
    tax_id_set.sort.each do |tax_id|
      tax_ids_str += tax_id.to_s
      tax_ids_str += ','
    end
    tax_ids_str = tax_ids_str.chomp(',')
    lineage_arr = TaxonLineage.connection.select_all("SELECT taxid, superkingdom_taxid,  genus_taxid FROM taxon_lineages WHERE taxid IN (#{tax_ids_str})").to_hash
    lineage_info = lineage_arr.group_by { |h| h['taxid'] }
    cat_id_set = Set.new(lineage_info.map { |_, taxons| taxons[0]['superkingdom_taxid'] })
    cat_id_set.delete(nil)
    category_taxids = ''
    cat_id_set.sort.each do |cat_id|
      category_taxids += cat_id.to_s
      category_taxids += ','
    end
    category_taxids = category_taxids.chomp(',')
    if !category_taxids.empty?
      taxon_name_arr = TaxonLineage.connection.select_all("select taxid, name from taxon_names where taxid in (#{category_taxids})").to_hash
      cat_name_info = taxon_name_arr.group_by { |h| h['taxid'] }
    else
      cat_name_info = []
    end

    # filter and sort the nt_scores
    htc = highest_tax_counts(taxon_zscores)
    rp = resolve_params(params, htc)

    taxon_zscores.keep_if do |h|
      (h[:tax_id] >= 0 &&
        h[:zscore] >= rp[:nt_zscore_threshold][:start] &&
        h[:zscore] <= rp[:nt_zscore_threshold][:end] &&
        h[:rpm] >= rp[:nt_rpm_threshold][:start] &&
        h[:rpm] <= rp[:nt_rpm_threshold][:end]
      )
    end

    # get tax_ids in order sorted by chosen field
    # sort_report!(taxon_zscores, params[:sort_by])
    tax_id_arr = taxon_zscores.map {|h| h[:tax_id]}
    tax_id_arr = Set.new tax_id_arr

    tax_hit = taxon_zscores.group_by { |h| [h[:tax_id], h[:hit_type]] }

    tax_details = tax_id_arr.map do |tax_id|
      linfo = lineage_info[tax_id] || [{}]
      linfo = linfo.first

      category_taxid = linfo["superkingdom_taxid"]
      category_info = cat_name_info[category_taxid]
      category_name = category_info ? category_info[0]['name'] : 'Other'

      genus_taxid = linfo["genus_taxid"]
      genus_nts = tax_hit[[genus_taxid, 'NT']] || [nil]
      genus_nrs = tax_hit[[genus_taxid, 'NR']] || [nil]

      nts = tax_hit[[tax_id, 'NT']] || [nil]
      nrs = tax_hit[[tax_id, 'NR']] || [nil]

      {
        nt_ele: nts[0],
        nr_ele: nrs[0],
        category: category_name,
        genus_nt_ele: genus_nts[0],
        genus_nr_ele: genus_nrs[0]
      }
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

  def highest_tax_counts(taxon_zscores)
    hit = taxon_zscores.group_by { |h| h[:hit_type] }
    nt = hit['NT'] || []
    nr = hit['NR'] || []
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
