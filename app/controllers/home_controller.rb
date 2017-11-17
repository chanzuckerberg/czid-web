class HomeController < ApplicationController
  before_action :login_required
  include SamplesHelper

  def home
    @all_project = Project.all
    project_id = params[:project_id]
    search_query = params[:search]
    sort = params[:sort_by]
    @project_info = nil

    if params[:ids].present?
      samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where("id in (#{params[:ids]})")
      @samples = sort_by(samples.paginate(page: params[:page]), sort)
      @samples_count = samples.size
      @all_samples = format_samples(@samples)
    elsif project_id.present?
      if search_query.present?
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id).search(search_query)
        @samples = sort_by(samples.paginate(page: params[:page]), sort)
        @samples_count = samples.size
      else
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id)
        @samples = sort_by(samples.paginate(page: params[:page]), sort)
        @samples_count = samples.size
      end
      @project_info = Project.find(project_id)
      @all_samples = format_samples(@samples)
        # all_samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id)
    else
      if search_query.present?
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs).search(search_query)
        @samples = sort_by(samples.paginate(page: params[:page]), sort)
      else
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs)
        @samples = sort_by(samples.paginate(page: params[:page]), sort)
      end
        @samples_count = samples.size
        @all_samples = format_samples(@samples)
        # all_samples = Sample.includes(:pipeline_runs, :pipeline_outputs).all
      end
      # @all_samples = format_samples(@samples)
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(created_at: :desc) : samples.order(created_at: :asc)
  end
end
