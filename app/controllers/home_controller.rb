class HomeController < ApplicationController
  # before_action :login_required
  include SamplesHelper

  def index
    @all_project = Project.all
    project_id = params[:project_id]
    sort = params[:sort_by]
    @project_info = nil

    if params[:ids].present?
      @samples = sort_by(Sample.includes(:pipeline_runs, :pipeline_outputs).where("id in (#{params[:ids]})").paginate(page: params[:page]), sort)
      @samples_count = @samples.size
    elsif project_id.present?
      @samples = sort_by(Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id).paginate(page: params[:page]), sort)
      @project_info = Project.find(project_id)
      @samples_count = Sample.where(project_id: project_id).size
    else
      @samples = sort_by(Sample.includes(:pipeline_runs, :pipeline_outputs).paginate(page: params[:page]), sort)
      @samples_count = Sample.all.size
    end
    samples_info_output = samples_info(@samples) || {}
    @final_result = samples_info_output[:final_result] || []
    @pipeline_run_info = samples_info_output[:pipeline_run_info] || []
    respond_to do |format|
      format.html
      format.json { render json: {samples_info: samples_info_output, samples: @samples, project_info: @project_info, all_projects: @all_project, samples_count: @samples_count} }
    end
  end

  def search
    project_id = params[:project_id]
    search_query = params[:search]

    @samples = if project_id.present?
                 Sample.includes(:pipeline_runs, :pipeline_outputs).search(search_query).where(project_id: project_id)
               else
                 Sample.includes(:pipeline_runs, :pipeline_outputs).search(search_query)
               end
    @final_result = samples_info(@samples)[:final_result]
    @pipeline_run_info = samples_info(@samples)[:pipeline_run_info]
    if @samples.length
      respond_to do |format|
        format.json { render json: { samples: @samples, final_result: @final_result, pipeline_run_info: @pipeline_run_info }, message: 'Search results found' }
      end
    else
      respond_to do |format|
        format.json { render message: 'No Search results found' }
      end
    end
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(created_at: :desc) : samples.order(created_at: :asc)
  end
end
