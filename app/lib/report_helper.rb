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
    tax_ids = filter(sort_report(nt_zscores, params[:sort_by]),
                     resolve_params(params)[:nt_zscore_start],
                     resolve_params(params)[:nt_zscore_end],
                     resolve_params(params)[:nt_rpm_start],
                     resolve_params(params)[:nt_rpm_end])
                .where.not("tax_id < 0").limit(20).map(&:tax_id)
    tax_ids.each do |id|
      tax_details.push(nt_ele: nt_zscores.find_by(tax_id: id), nr_ele: nr_zscores.find_by(tax_id: id))
    end
    tax_details
  end

  def resolve_params(params)
    new_params = {}
    nt_zscore_threshold =
      params[:nt_zscore_threshold] ? params[:nt_zscore_threshold].split('-') : []
    nt_rpm_threshold =
      params[:nt_rpm_threshold] ? params[:nt_rpm_threshold].split('-') : []
    new_params[:nt_zscore_start] = nt_zscore_threshold[0]
    new_params[:nt_zscore_end] = nt_zscore_threshold[1]
    new_params[:nt_rpm_start] = nt_rpm_threshold[0]
    new_params[:nt_rpm_end] = nt_rpm_threshold[1]

    new_params
  end

  def highest_tax_counts(view_level, report)
    nt_zscores = select_zscore(view_level, report.taxon_zscores)[:nt_zscores]
    nr_zscores = select_zscore(view_level, report.taxon_zscores)[:nr_zscores]
    metrics = metrics(nt_zscores, nr_zscores)
    metrics
  end

  def metrics(nt, nr)
    metrics = {}
    metrics[:highest_nt_zscore] =
      nt.order(zscore: :desc).first ? nt.order(zscore: :desc).first[:zscore] : 0
    metrics[:highest_nr_zscore] =
      nr.order(zscore: :desc).first ? nr.order(zscore: :desc).first[:zscore] : 0
    metrics[:highest_nt_rpm] =
      nt.order(rpm: :desc).first ? nt.order(rpm: :desc).first[:rpm] : 0
    metrics[:highest_nr_rpm] =
      nr.order(rpm: :desc).first ? nr.order(rpm: :desc).first[:rpm] : 0
    metrics
  end

  def filter(nt_zscores, nt_threshold_start, nt_threshold_end,
             nt_rpm_threshold_start, nt_rpm_threshold_end)
    decimal = 0.999999
    if nt_threshold_start && nt_threshold_end
      nt_zscores = nt_zscores.where('zscore >= ? AND zscore <= ?',
      nt_threshold_start, Float(nt_threshold_end) + decimal)
    end
    if nt_rpm_threshold_start && nt_rpm_threshold_end
      nt_zscores = nt_zscores.where('rpm >= ? AND rpm <= ?',
      nt_rpm_threshold_start, Float(nt_rpm_threshold_end) + decimal)
    end
    nt_zscores
  end

  def sort_report(nt_zscores, sort_by)
    sort_by = 'highest_zscore' if sort_by.nil?

    nt_zscores = nt_zscores.order(zscore: :asc) if sort_by == 'lowest_zscore'
    nt_zscores = nt_zscores.order(zscore: :desc) if sort_by == 'highest_zscore'
    nt_zscores = nt_zscores.order(rpm: :asc) if sort_by == 'lowest_rpm'
    nt_zscores = nt_zscores.order(rpm: :desc) if sort_by == 'highest_rpm'
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
