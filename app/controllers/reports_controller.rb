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
    @report.pipeline_output.taxon_counts.each do |taxon_count|
      a = {}
      a[:tax_id] = taxon_count.tax_id
      a[:tax_level] = taxon_count.tax_level
      a[:name] = taxon_count.name
      normalized_count = taxon_count.count.to_f/@report.pipeline_output.total_reads 
      sum = normalized_count
      sum_sq = normalized_count**2 
      n = 1
      @report.background.samples.each do |background_sample|
        bg_pipeline_output = background_sample.pipeline_outputs.first	
        bg_taxon_count = bg_pipeline_output.taxon_counts.find_by(tax_id: taxon_count.tax_id)
        if bg_taxon_count
          bg_count = bg_taxon_count.count
          normalized_bg_count = bg_count.to_f/bg_pipeline_output.total_reads
	else 
	  normalized_bg_count = 0
	end
	sum += normalized_bg_count
	sum_sq += normalized_bg_count**2
	n += 1
      end
      mean = sum.to_f/n
      stdev = Math.sqrt((sum_sq.to_f - sum**2/n)/(n-1))
      if stdev > 0
	a[:nt_zscore] = (normalized_count-mean)/stdev
      else 
	a[:nt_zscore] = 0 
      end
      @report.taxon_zscores.new(a)
    end

    respond_to do |format|
      if @report.save
        format.html { redirect_to @report, 
                      notice: 'Report was successfully created.' }
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
    # Use callbacks to share common setup or constraints between actions.
    def set_report
      @report = Report.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def report_params
      params.require(:report).permit(:name, :pipeline_output_id, :background_id, taxon_zscores_attributes: [:tax_id, :tax_level, :nt_zscore, :name])
    end
end
