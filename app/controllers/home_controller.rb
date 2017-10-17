class HomeController < ApplicationController
  include SamplesHelper
  def home
    @final_result = []
    @samples = Sample.includes(:pipeline_runs, :pipeline_outputs).paginate(page: params[:page]).order('created_at DESC')
    @project_info = @samples ? @samples.first.project : nil

    @samples.each do |output|
      output_data = {}
      pipeline_info = output.pipeline_runs.first ? output.pipeline_runs.first.pipeline_output : nil
      job_stats = output.pipeline_outputs.first ? output.pipeline_outputs.first.job_stats : nil
      pipeline_run = output.pipeline_runs.first ? output.pipeline_runs.first : nil
      summary_stats = job_stats ? get_summary_stats(job_stats) : nil

      output_data[:pipeline_info] = pipeline_info
      output_data[:pipeline_run] = pipeline_run
      output_data[:job_stats] = job_stats
      output_data[:summary_stats] = summary_stats
      @final_result.push(output_data)
    end
  end
end
