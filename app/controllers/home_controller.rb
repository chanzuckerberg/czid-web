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
    results = sort_by(Sample.includes(:pipeline_runs, :pipeline_outputs), sort)
    all_samples = results

    results = results.where("id in (#{params[:ids]})") if params[:ids].present?

    if project_id.present?
      @project_info = Project.find(project_id)
      results = results.where(project_id: project_id)
      project_samples = results
    end

    if project_id.present? && name_search_query.present?
      results = project_samples.search(name_search_query)
      project_search_results = results
    end

    if project_id.present? && filter_query.present?
      results = filter_samples(all_samples, filter_query)
    end

    if project_id.present? && name_search_query.present? && filter_query.present?
      results = filter_samples(project_search_results, filter_query)
    end

    if name_search_query.present?
      results = all_samples.search(name_search_query)
      all_search_results = results
    end

    results = filter_samples(all_samples, filter_query) if filter_query.present?

    if name_search_query.present? && filter_query.present?
      results = filter_samples(all_search_results, filter_query)
    end

    @samples = results.paginate(page: params[:page], per_page: 10)
    @samples_count = results.size
    @all_samples = format_samples(@samples)
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(created_at: :desc) : samples.order(created_at: :asc)
  end
end
