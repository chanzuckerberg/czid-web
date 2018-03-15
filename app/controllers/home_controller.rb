require 'will_paginate/array'
class HomeController < ApplicationController
  include SamplesHelper
  before_action :login_required
  power :projects

  def index
    @favorite_projects = current_user.favorites
    project_records = current_power.projects
    @projects = []
    project_records.each do |p_r|
      p = p_r.as_json
      p["is_empty"] = p_r.can_delete?(current_user)
      @projects << p
    logger.warn @projects
    @editable_project_ids = current_power.updatable_projects.pluck(:id)
    @host_genomes = HostGenome.all.reject { |hg| hg.name.downcase.include?("__test__") }
    render 'home'
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(id: :desc) : samples.order(id: :asc)
  end
end
