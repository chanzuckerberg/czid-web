# rubocop:disable ModuleLength
module ReportHelper
  def external_report_info(report, view_level, params)
    taxon_zscores = compute_taxon_zscores(report)
    data = {}
    data[:report_details] = report_details(report)
    data[:taxonomy_details] = taxonomy_details(view_level, report, params, taxon_zscores)
    data[:highest_tax_counts] = highest_tax_counts(view_level, report, taxon_zscores)
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

  def taxonomy_details(view_level, _report, params, taxon_zscores)
    sz = select_zscore(view_level, taxon_zscores)
    # filter and sort the nt_scores
    sort_report!(sz[:nt_zscores], params[:sort_by])
    rp = resolve_params(params)
    sz[:nt_zscores].keep_if do |h|
      (h[:tax_id] >= 0 &&
        h[:zscore] >= rp[:nt_zscore_threshold][:start] &&
        h[:zscore] < rp[:nt_zscore_threshold][:end] &&
        h[:rpm] >= rp[:nt_rpm_threshold][:start] &&
        h[:rpm] < rp[:nt_rpm_threshold][:end]
      )
    end
    # cross-references nr_zscores by taxon id
    nr_zscore_by_taxon = {}
    sz[:nr_zscores].each do |h|
      nr_zscore_by_taxon[h[:tax_id]] = h
    end
    # pull nt and nr scores for each taxon in order sorted above
    tax_details = []
    sz[:nt_zscores].each do |h|
      tax_details.push(nt_ele: h, nr_ele: nr_zscore_by_taxon[h[:tax_id]])
    end
    tax_details
  end

  def resolve_params(params)
    new_params = {}
    [:nt_zscore_threshold, :nt_rpm_threshold].each do |k|
      s, e = params[k] ? params[k].split('-') : []
      new_params[k] = {
        start: Float(s || -1_000_000_000),
        end: Float(e || 1_000_000_000) + 1.0
      }
    end
    new_params
  end

  def highest_tax_counts(view_level, _report, taxon_zscores)
    sz = select_zscore(view_level, taxon_zscores)
    nt = sz[:nt_zscores]
    nr = sz[:nr_zscores]
    {
      highest_nt_zscore: nt.map { |h| h[:z_score] }.sort[-1] || 0,
      highest_nr_zscore: nr.map { |h| h[:z_score] }.sort[-1] || 0,
      highest_nt_rpm: nt.map { |h| h[:rpm] }.sort[-1] || 0,
      highest_nr_rpm: nr.map { |h| h[:rpm] }.sort[-1] || 0
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

  def select_zscore(level, zscores)
    wanted_level = level == :species ? TaxonCount::TAX_LEVEL_SPECIES : TaxonCount::TAX_LEVEL_GENUS
    result = {
      nr_zscores: [],
      nt_zscores: []
    }
    zscores.each do |z|
      next unless z[:tax_level] == wanted_level
      t =  z[:hit_type] == :NR || z[:hit_type] == "NR" ? :nr_zscores : :nt_zscores
      result[t].push(z)
    end
    result
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
      1e6
    else
      0
    end
  end
end
