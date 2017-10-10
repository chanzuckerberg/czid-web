# rubocop:disable ModuleLength
module ReportHelper
  def external_report_info(report, view_level, params)
    data = {}
    data[:report_details] = report_details(report)
    htc, td = taxonomy_details(view_level, report, params)
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

  # rubocop:disable Metrics/CyclomaticComplexity
  # rubocop:disable Metrics/PerceivedComplexity
  def taxonomy_details(view_level, report, params)
    taxon_zscores = compute_taxon_zscores(report)
    wanted_level = view_level == 'species' ? TaxonCount::TAX_LEVEL_SPECIES : TaxonCount::TAX_LEVEL_GENUS
    data = taxon_zscores.group_by { |h| h[:tax_level] == wanted_level && h[:hit_type] }
    nt = data['NT'] || []
    nr = data['NR'] || []
    htc = highest_tax_counts(nt, nr)
    # filter and sort the nt_scores
    rp = resolve_params(params, htc)
    nt.keep_if do |h|
      (h[:tax_id] >= 0 &&
        h[:zscore] >= rp[:nt_zscore_threshold][:start] &&
        h[:zscore] <= rp[:nt_zscore_threshold][:end] &&
        h[:rpm] >= rp[:nt_rpm_threshold][:start] &&
        h[:rpm] <= rp[:nt_rpm_threshold][:end]
      )
    end
    sort_report!(nt, params[:sort_by])
    nr_zscore_by_taxon = nr.group_by { |h| h[:tax_id] }
    tax_details = []
    nt.each do |h|
      x = nr_zscore_by_taxon[h[:tax_id]]
      tax_details.push(nt_ele: h, nr_ele: x && x[0])
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
