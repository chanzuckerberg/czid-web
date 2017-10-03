class PipelineOutputsController < ApplicationController
  include ReportHelper
  before_action :set_pipeline_output, only: [:show, :edit, :update, :destroy]
  protect_from_forgery unless: -> { request.format.json? }

  # GET /pipeline_outputs
  # GET /pipeline_outputs.json
  def index
    @pipeline_outputs = PipelineOutput.all
  end

  # GET /pipeline_outputs/1
  # GET /pipeline_outputs/1.json
  def show
    @view_level = params[:view_level] ? params[:view_level].downcase : 'genus'
    @report_info = {}
    report = @pipeline_output.reports.first
    if report
      external_report_info = external_report_info(report, @view_level, params)
      @report_info[:report_details] = external_report_info[:report_details]
      @report_info[:taxonomy_details] = external_report_info[:taxonomy_details]
      @report_info[:highest_tax_counts] = external_report_info[:highest_tax_counts]
      @report_info[:view_level] = external_report_info[:view_level]
    end
  end

  # GET /pipeline_outputs/new
  def new
    @pipeline_output = PipelineOutput.new
  end

  # GET /pipeline_outputs/1/edit
  def edit
  end

  # POST /pipeline_outputs
  # POST /pipeline_outputs.json
  def create
    project_name = params[:pipeline_output].delete(:project_name)
    sample_name = params[:pipeline_output].delete(:sample_name)
    project = Project.find_by(name: project_name)
    @sample = Sample.find_by(name: sample_name, project: project) || Sample.new(name: sample_name, project: project)
    @sample.save

    @pipeline_output = PipelineOutput.new(pipeline_output_params)
    @pipeline_output.sample = @sample

    # params.require(:job_id)
    fake_job_id = (0...8).map { (65 + rand(26)).chr }. join
    @pipeline_output.pipeline_run = PipelineRun.create(sample: @sample, job_id: fake_job_id)

    respond_to do |format|
      if @pipeline_output.save
        format.html { redirect_to @pipeline_output, notice: 'Pipeline output was successfully created.' }
        format.json { render :show, status: :created, location: @pipeline_output }
      else
        format.html { render :new }
        format.json { render json: @pipeline_output.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /pipeline_outputs/1
  # PATCH/PUT /pipeline_outputs/1.json
  def update
    respond_to do |format|
      if @pipeline_output.update(pipeline_output_params)
        format.html { redirect_to @pipeline_output, notice: 'Pipeline output was successfully updated.' }
        format.json { render :show, status: :ok, location: @pipeline_output }
      else
        format.html { render :edit }
        format.json { render json: @pipeline_output.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /pipeline_outputs/1
  # DELETE /pipeline_outputs/1.json
  def destroy
    @pipeline_output.destroy
    respond_to do |format|
      format.html { redirect_to pipeline_outputs_url, notice: 'Pipeline output was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_pipeline_output
    @pipeline_output = PipelineOutput.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def pipeline_output_params
    params.require(:pipeline_output).permit(:sample_id, :name, :total_reads, :remaining_reads,
                                            taxon_counts_attributes: [:tax_id, :tax_level, :count, :name, :count_type],
                                            job_stats_attributes: [:task, :reads_before, :reads_after])
  end
end
