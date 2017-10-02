module ReportHelper
  def external_report_info(report, view_level, params)
    data = {}
    data[:report_details] = report_details(report)
    data[:taxonomy_details] = taxonomy_details(view_level, report, params)
    data[:highest_tax_counts] = highest_tax_counts(view_level, report)
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

  def taxonomy_details(view_level, report, params)
    tax_details = []
    nt_zscores = select_zscore(view_level, report.taxon_zscores)[:nt_zscores]
    nr_zscores = select_zscore(view_level, report.taxon_zscores)[:nr_zscores]
    tax_ids = filter(nt_zscores, params[:nt_zscore_threshold], params[:nr_zscore_threshold],
                     params[:nt_rpm_threshold], params[:nr_rpm_threshold])
              .order(zscore: :desc).where.not("tax_id < 0").limit(20).map(&:tax_id)
    tax_ids.each do |id|
      tax_details.push(nt_ele: nt_zscores.find_by(tax_id: id), nr_ele: nr_zscores.find_by(tax_id: id))
    end
    tax_details
  end

  def highest_tax_counts(view_level, report)
    metrics = {}
    nt_zscores =
      select_zscore(view_level, report.taxon_zscores)[:nt_zscores]
    highest_zscore = nt_zscores.order(zscore: :desc).first
    highest_rpm = nt_zscores.order(rpm: :desc).first
    if highest_zscore && highest_rpm
      metrics[:highest_zscore] = highest_zscore[:zscore]
      metrics[:highest_rpm] = highest_rpm[:rpm]
    end
    metrics
  end

  def filter(nt_zscores, nt_threshold, nr_threshold, nt_rpm_threshold, nr_rpm_threshold)
    nt_zscores = nt_zscores.where('zscore >= ?', nt_threshold) if nt_threshold
    nt_zscores = nt_zscores.where('zscore >= ?', nr_threshold) if nr_threshold
    nt_zscores = nt_zscores.where('rpm >= ?', nt_rpm_threshold) if nt_rpm_threshold
    nt_zscores = nt_zscores.where('rpm >= ?', nr_rpm_threshold) if nr_rpm_threshold
    nt_zscores
  end

  def select_zscore(type, zscores)
    zscore = {}
    if type == 'species'
      zscore[:nt_zscores] = zscores.type('NT').level(TaxonCount::TAX_LEVEL_SPECIES)
      zscore[:nr_zscores] = zscores.type('NR').level(TaxonCount::TAX_LEVEL_SPECIES)
    else
      zscore[:nt_zscores] = zscores.type('NT').level(TaxonCount::TAX_LEVEL_GENUS)
      zscore[:nr_zscores] = zscores.type('NR').level(TaxonCount::TAX_LEVEL_GENUS)
    end
    zscore
  end
end
