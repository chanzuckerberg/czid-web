class ReportsController < ApplicationController
  before_action :set_report, only: [:show, :edit, :update, :destroy]
  before_action :typed_zscores, only: [:show]

  # GET /reports
  # GET /reports.json
  def index
    @reports = Report.all
  end

  # GET /reports/1
  # GET /reports/1.json
  def show
    @nt_zscore_threshold = params[:nt_zscore_threshold]
    @nt_rpm_threshold = params[:nt_rpm_threshold]
    @nr_zscore_threshold = params[:nr_zscore_threshold]
    @nr_rpm_threshold = params[:nr_rpm_threshold]
    @view_level = params[:view_level]
    respond_to do |format|
      format.html
      format.json { render json: @report.to_json(include: :taxon_zscores) }
    end
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
    data = @report.pipeline_output.taxon_counts.map { |h| h.attributes.merge(rpm: compute_rpm(h["count"], total_reads) }
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

  def typed_zscores
    zscores = @report.taxon_zscores
    @nt_species_zscores = zscores.type('NT').level(TaxonCount::TAX_LEVEL_SPECIES)
    @nr_species_zscores = zscores.type('NR').level(TaxonCount::TAX_LEVEL_SPECIES)
    @ordered_nt_species_tax_ids = @nt_species_zscores.order(zscore: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_nr_species_tax_ids = @nr_species_zscores.order(zscore: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_species_tax_ids = (@ordered_nt_species_tax_ids + @ordered_nr_species_tax_ids).uniq
    @nt_genus_zscores = zscores.type('NT').level(TaxonCount::TAX_LEVEL_GENUS)
    @nr_genus_zscores = zscores.type('NR').level(TaxonCount::TAX_LEVEL_GENUS)
    @ordered_nt_genus_tax_ids = @nt_genus_zscores.order(zscore: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_nr_genus_tax_ids = @nr_genus_zscores.order(zscore: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_genus_tax_ids = (@ordered_nt_genus_tax_ids + @ordered_nr_genus_tax_ids).uniq
  end

  def compute_rpm(count, total_reads)
    if count
      count * 1e6 / total_reads.to_f
    else
      0
    end
  end

  def compute_zscore(rpm, mean, stdev)
    if rpm && mean
      (rpm - mean) / stdev
    elsif rpm
      Float::MAX
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
