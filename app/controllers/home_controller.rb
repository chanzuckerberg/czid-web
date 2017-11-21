require 'will_paginate/array'
class HomeController < ApplicationController
  before_action :login_required
  include SamplesHelper

  def home
    @all_project = Project.all
    project_id = params[:project_id]
    name_search_query = params[:search]
    filter_query = params[:filter]
    sort = params[:sort_by]
    @project_info = nil
    results = Sample.includes(:pipeline_runs, :pipeline_outputs)

    results = results.where("id in (#{params[:ids]})") if params[:ids].present?

    if project_id.present?
      @project_info = Project.find(project_id)
      results = results.where(project_id: project_id)
    end

    results = results.search(name_search_query) if name_search_query.present?
    results = filter_samples(results, filter_query) if filter_query.present?

    @samples = sort_by(results, sort).paginate(page: params[:page], per_page: 10)
    @samples_count = results.size
    @all_samples = format_samples(@samples)
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(created_at: :desc) : samples.order(created_at: :asc)
  end
end
