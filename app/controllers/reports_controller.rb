class ReportsController < ApplicationController
  before_action :set_report, only: [:show, :edit, :update, :destroy]

  # GET /reports
  # GET /reports.json
  def index
    @reports = Report.all
  end

  # GET /reports/1
  # GET /reports/1.json
  def show
    @report_details = report_details
    @view_level = params[:view_level] ? params[:view_level] : 'genus'
    @taxonomy_details = taxonomy_details(@view_level)
    @highest_tax_counts = highest_tax_counts(@view_level)
  end

  # GET /reports/new
  def new
    @report = Report.new
  end

  # GET /reports/1/edit
  def edit
  end

  # POST /reports
  # POST /reports.json
  def create
    @report = Report.new(report_params)
    @report.background ||= Background.find_by(name: Background::DEFAULT_BACKGROUND_MODEL_NAME)
    raise "No background specified and background #{Background::DEFAULT_BACKGROUND_MODEL_NAME} does not exist" unless @report.background
    total_reads = @report.pipeline_output.total_reads
    summary = @report.background.summarize
    data = @report.pipeline_output.taxon_counts.map { |h| h.attributes.merge(rpm: compute_rpm(h["count"], total_reads)) }
    data_and_background = (data + summary).group_by { |h| [h["tax_id"], h["tax_level"], h["name"], h["count_type"]] }.map { |_k, v| v.reduce(:merge) }.select { |h| h["count"] }
    zscore_array = data_and_background.map { |h| { tax_id: h["tax_id"], tax_level: h["tax_level"], name: h["name"], rpm: h[:rpm], hit_type: h["count_type"], zscore: compute_zscore(h[:rpm], h[:mean], h[:stdev]) } }
    @report.taxon_zscores << TaxonZscore.create(zscore_array)

    respond_to do |format|
      if @report.save
        format.html { redirect_to @report, notice: 'Report was successfully created.' }
        format.json { render :show, status: :created, location: @report }
      else
        format.html { render :new }
        format.json { render json: @report.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /reports/1
  # PATCH/PUT /reports/1.json
  def update
    respond_to do |format|
      if @report.update(report_params)
        format.html { redirect_to @report, notice: 'Report was successfully updated.' }
        format.json { render :show, status: :ok, location: @report }
      else
        format.html { render :edit }
        format.json { render json: @report.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /reports/1
  # DELETE /reports/1.json
  def destroy
    @report.destroy
    respond_to do |format|
      format.html { redirect_to reports_url, notice: 'Report was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  def report_details
    {
      report_info: @report,
      pipeline_info: @report.pipeline_output,
      sample_info: @report.pipeline_output.sample,
      project_info: @report.pipeline_output.sample.project,
      background_model: @report.background
    }
  end

  def taxonomy_details(view_level)
    view_level = view_level.downcase
    zscores = @report.taxon_zscores
    nt_zscore_threshold = params[:nt_zscore_threshold]
    nt_rpm_threshold = params[:nt_rpm_threshold]
    nr_zscore_threshold = params[:nr_zscore_threshold]
    nr_rpm_threshold = params[:nr_rpm_threshold]
    tax_details = []
    if view_level == 'species'
      nt_zscores = zscores.type('NT').level(TaxonCount::TAX_LEVEL_SPECIES)
      nr_zscores = zscores.type('NR').level(TaxonCount::TAX_LEVEL_SPECIES)
    else
      nt_zscores = zscores.type('NT').level(TaxonCount::TAX_LEVEL_GENUS)
      nr_zscores = zscores.type('NR').level(TaxonCount::TAX_LEVEL_GENUS)
    end

    # TODO, discuss why the NT score is sorted and not the NR score
    @tax_ids = filter(nt_zscores, nt_zscore_threshold, nr_zscore_threshold,
                      nt_rpm_threshold, nr_rpm_threshold)
                 .paginate(page: params[:page])
                 .order(zscore: :desc).where.not("tax_id < 0").map(&:tax_id)
    @tax_ids.each do |id|
      nt_ele = nt_zscores.find_by(tax_id: id)
      nr_ele = nr_zscores.find_by(tax_id: id)
      tax_details.push(nt_ele: nt_ele, nr_ele: nr_ele)
    end
    tax_details
  end

  def highest_tax_counts(view_level)
    view_level = view_level.downcase
    zscores = @report.taxon_zscores
    metrics = {}
    view_level == 'species' ?
      nt_zscores = zscores.type('NT').level(TaxonCount::TAX_LEVEL_SPECIES) :
      nt_zscores = zscores.type('NT').level(TaxonCount::TAX_LEVEL_GENUS)
    highest_zscore = nt_zscores.order(zscore: :desc).first
    highest_rpm = nt_zscores.order(rpm: :desc).first
    metrics[:highest_zscore] = highest_zscore.zscore
    metrics[:highest_rpm] = highest_rpm.rpm
    metrics
  end

  def filter(nt_zscores, nt_threshold, nr_threshold, nt_rpm_threshold, nr_rpm_threshold)
    nt_zscores = nt_zscores.where('zscore >= ?', nt_threshold) if nt_threshold
    nt_zscores = nt_zscores.where('zscore >= ?', nr_threshold) if nr_threshold
    nt_zscores = nt_zscores.where('rpm >= ?', nt_rpm_threshold) if nt_rpm_threshold
    nt_zscores = nt_zscores.where('rpm >= ?', nr_rpm_threshold) if nr_rpm_threshold
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
      1e6
    else
      0
    end
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_report
    @report = Report.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def report_params
    params.require(:report).permit(:name, :pipeline_output_id, :background_id, taxon_zscores_attributes: [:tax_id, :tax_level, :zscore, :rpm, :hit_type, :name])
  end
end
