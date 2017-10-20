class HomeController < ApplicationController
  before_action :login_required
  include SamplesHelper
  def home
    @final_result = []
    @all_project = Project.all
    project_id = params[:project_id]
    sort = params[:sort_by]
    @project_info = nil

    if project_id.nil?
      @samples = sort_by(Sample.includes(:pipeline_runs, :pipeline_outputs).paginate(page: params[:page]), sort)
    else
      @samples = sort_by(Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id).paginate(page: params[:page]), sort)
      @project_info = Project.find(project_id) unless project_id.nil?
    end

    @samples.each do |output|
      output_data = {}
      pipeline_info = output.pipeline_runs.first ? output.pipeline_runs.first.pipeline_output : nil
      job_stats = output.pipeline_outputs.first ? output.pipeline_outputs.first.job_stats : nil
      summary_stats = job_stats ? get_summary_stats(job_stats) : nil

      output_data[:pipeline_info] = pipeline_info
      output_data[:job_stats] = job_stats
      output_data[:summary_stats] = summary_stats
      @final_result.push(output_data)
    end
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(created_at: :desc) : samples.order(created_at: :asc)
  end
end
