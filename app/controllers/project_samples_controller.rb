class ProjectSamplesController < ApplicationController
  before_action :login_required
  include SamplesHelper

  def index
    @all_project = Project.all
    project_id = params[:project_id]
    name_search_query = params[:search]
    filter_query = params[:filter]
    sort = params[:sort_by]
    results = Sample.includes(:pipeline_runs, :pipeline_outputs)

    results = results.where("id in (#{params[:ids]})") if params[:ids].present?

    results = results.where(project_id: project_id) if project_id.present?

    results = results.search(name_search_query) if name_search_query.present?
    results = filter_samples(results, filter_query) if filter_query.present?

    @samples = sort_by(results, sort).paginate(page: params[:page], per_page: params[:per_page] || 15)
    @samples_count = results.size
    @all_samples = format_samples(@samples)

    render json: @all_samples
  end

  private

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(created_at: :desc) : samples.order(created_at: :asc)
  end
end
