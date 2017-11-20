require 'will_paginate/array'
class HomeController < ApplicationController
  before_action :login_required
  include SamplesHelper

  def home
    @all_project = Project.all
    project_id = params[:project_id]
    search_query = params[:search]
    filter_query = params[:filter]
    sort = params[:sort_by]
    @project_info = nil

    if params[:ids].present?
      samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where("id in (#{params[:ids]})")
    elsif project_id.present?
      if filter_query.present? && search_query.present?
        search_results = Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id).search(search_query)
        samples = filter_samples(search_results, filter_query)
      elsif search_query.present?
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id).search(search_query)
      elsif filter_query.present?
        unfiltered_samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id)
        samples = filter_samples(unfiltered_samples, filter_query)
      else
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs).where(project_id: project_id)
      end
      @project_info = Project.find(project_id)
    else
      if filter_query.present? && search_query.present?
        search_results = Sample.includes(:pipeline_runs, :pipeline_outputs).search(search_query)
        samples = filter_samples(search_results, filter_query)
      elsif search_query.present?
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs).search(search_query)
      elsif filter_query.present?
        unfiltered_samples = Sample.includes(:pipeline_runs, :pipeline_outputs)
        samples = filter_samples(unfiltered_samples, filter_query)
      else
        samples = Sample.includes(:pipeline_runs, :pipeline_outputs)
      end
    end
      @samples = samples.paginate(page: params[:page])
      @samples_count = samples.size
      @all_samples = format_samples(@samples)
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(created_at: :desc) : samples.order(created_at: :asc)
  end

end
