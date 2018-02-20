require 'will_paginate/array'
class HomeController < ApplicationController
  include SamplesHelper
  before_action :login_required
  power :projects

  def index
    @favorite_projects = current_user.favorites
    @projects = current_power.projects
    @editable_project_ids = current_power.updatable_projects.pluck(:id)
    @host_genomes = HostGenome.all.reject { |hg| hg.name.downcase.include?("__test__") }
    render 'home'
  end

  def select
    @favorite_projects = current_user.favorites
    @projects = current_power.projects
    @editable_project_ids = current_power.updatable_projects.pluck(:id)
    render 'select'
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(id: :desc) : samples.order(id: :asc)
  end
end
