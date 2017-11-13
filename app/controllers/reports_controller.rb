class ReportsController < ApplicationController
  # before_action :login_required, only: [:new, :edit, :update, :destroy, :create, :index, :show]
  before_action :set_report, only: [:show, :edit, :update, :destroy, :send_report_csv]
  include ReportHelper
  # GET /reports
  # GET /reports.json
  def index
    @reports = Report.all
  end

  # GET /reports/1
  # GET /reports/1.json
  def show
    report_info = external_report_info(@report, params)
    @report_details = report_info[:report_details]
    @taxonomy_details = report_info[:taxonomy_details]
    @report_page_params = report_info[:report_page_params]
    @all_genera_in_sample = report_info[:all_genera_in_sample]
    @all_categories = report_info[:all_categories]
  end

  # GET /reports/new
  def new
    @report = if params[:report]
                Report.new(params.require(:report).permit(:pipeline_output_id))
              else
                Report.new
              end
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

  def send_report_csv
    # override DEFAULT_PARAMS of report_helper.rb to get raw data
    # TO DO: add flag to turn off thresholding rather than editing params
    params[:threshold_zscore] = 0
    params[:threshold_rpm] = 0
    params[:threshold_r] = 0
    params[:threshold_percentidentity] = 0
    params[:threshold_alignmentlength] = 0
    params[:threshold_neglogevalue] = 0
    params[:threshold_aggregatescore] = 0
    params[:excluded_categories] = 'None'
    # serve CSV
    @report_csv = generate_report_csv(external_report_info(@report, params))
    send_data @report_csv, filename: @report.pipeline_output.sample.name + '_report.csv'
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_report
    @report = Report.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def report_params
    params.require(:report).permit(:name, :pipeline_output_id, :background_id, taxon_zscores_attributes: [:tax_id, :tax_level, :zscore, :rpm, :hit_type, :name])
  end
end
