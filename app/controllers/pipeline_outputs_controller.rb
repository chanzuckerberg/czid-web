class PipelineOutputsController < ApplicationController
  include ReportHelper
  before_action :set_pipeline_output, only: [:show]
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

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_pipeline_output
    @pipeline_output = PipelineOutput.find(params[:id])
  end

end
