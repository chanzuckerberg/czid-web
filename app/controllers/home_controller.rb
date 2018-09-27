require 'will_paginate/array'

class HomeController < ApplicationController
  include SamplesHelper
  before_action :login_required, except: [:landing, :sign_up]
  skip_before_action :authenticate_user!, :verify_authenticity_token, only: [:landing, :sign_up]
  power :projects, except: [:landing, :sign_up]

  # Public unsecured landing page
  def landing
    Rails.logger.info("hello there")
    if current_user
      # Call secure home#index path if authenticated
      redirect_to home_path
    else
      render 'landing'
    end
  end

  def index
    @favorite_projects = current_user.favorites
    @projects = current_power.projects
    @editable_project_ids = current_power.updatable_projects.pluck(:id)
    @host_genomes = HostGenome.all.reject { |hg| hg.name.downcase.include?("__test__") }
    @user_is_admin = current_user.role == 1 ? 1 : 0
    @background_models = current_power.backgrounds
    render 'home'
  end

  def taxon_descriptions
    # Get taxon descriptions for a list of taxids seperated by ','
    # Example: http://localhost:3000/taxon_descriptions?taxon_list=561,562,570,573
    taxon_list = params[:taxon_list].split(",").map(&:to_i)
    output = {}
    TaxonDescription.where(taxid: taxon_list).each do |taxon|
      output[taxon[:taxid]] = taxon.slice(:taxid, :title, :summary, :wiki_url)
    end
    render json: output
  end

  def sort_by(samples, dir = nil)
    default_dir = 'newest'
    dir ||= default_dir
    dir == 'newest' ? samples.order(id: :desc) : samples.order(id: :asc)
  end

  def feedback
    render json: {
      status: 'ok'
    }
  end

  def sign_up
    Rails.logger.info("these are the params " + home_params.to_s)
    mail(to: "accounts@idseq.net", subject: "New sign up from landing page", subject: )
  end

  private

  def home_params
    params.require(:signUp).permit(:firstName, :lastName, :email, :institution, :usage)
  end
end
