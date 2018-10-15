require "will_paginate/array"
require "base64"

class HomeController < ApplicationController
  include SamplesHelper
  before_action :login_required, except: [:landing, :sign_up]
  skip_before_action :authenticate_user!, :verify_authenticity_token, only: [:landing, :sign_up]
  power :projects, except: [:landing, :sign_up]

  # Public unsecured landing page
  def landing
    if current_user
      # Call secure home#index path if authenticated
      redirect_to home_path
    else
      if Time.now.utc > DateTime.strptime("1539702000", "%s")
        @bulletin_title = Base64.decode64("R3JhbmQgQ2hhbGxlbmdlcyBHcmFudCBSRlA=")
        @bulletin_description = Base64.decode64("SW4gY29sbGFib3JhdGlvbiB3aXRoIHRoZSBHYXRlcyBGb3VuZGF0aW9uLCBDaGFuIFp1Y2tlcmJlcmcgSW5pdGlhdGl2ZSBhbmQgQ2hhbiBadWNrZXJiZXJnIEJpb2h1YiBoYXZlIGFubm91bmNlZCBhIEdyYW5kIENoYWxsZW5nZXMgR3JhbnQgdGhhdCB3aWxsIHVzZSBJRHNlcSB0byBidWlsZCBjYXBhY2l0eSBmb3IgbWV0YWdlbm9taWMgc2VxdWVuY2luZyBpbiBsYWJzIGFyb3VuZCB0aGUgd29ybGQu")
        @bulletin_link = Base64.decode64("aHR0cHM6Ly9nY2doLmdyYW5kY2hhbGxlbmdlcy5vcmcvY2hhbGxlbmdlL2FwcGxpY2F0aW9uLW1ldGFnZW5vbWljLW5leHQtZ2VuZXJhdGlvbi1zZXF1ZW5jaW5nLWRldGVjdC1hbmQtaWRlbnRpZnktcGF0aG9nZW5zLXJvdW5kLTIy")
      end
      render "landing"
    end
  end

  def index
    @favorite_projects = current_user.favorites
    @projects = current_power.projects
    @editable_project_ids = current_power.updatable_projects.pluck(:id)
    @host_genomes = HostGenome.all.reject { |hg| hg.name.downcase.include?("__test__") }
    @user_is_admin = current_user.role == 1 ? 1 : 0
    @background_models = current_power.backgrounds
    render "home"
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
    default_dir = "newest"
    dir ||= default_dir
    dir == "newest" ? samples.order(id: :desc) : samples.order(id: :asc)
  end

  def feedback
    render json: {
      status: "ok"
    }
  end

  def sign_up
    # Send sign up email with filled out information
    required = [:firstName, :lastName, :email, :institution]
    unless required.all? { |r| home_params.key?(r.to_s) && home_params[r].present? }
      render json: {}, status: :not_acceptable
      return
    end

    body = ""
    home_params.each do |k, v|
      body += "#{k}: #{v}\n"
    end
    Rails.logger.info("New sign up:\n#{body}")
    UserMailer.landing_sign_up_email(body).deliver_now
    render json: {
      status: :ok
    }
  rescue => e
    Rails.logger.warn("Sign up error: #{e}")
    render json: {
      status: :internal_server_error
    }
  end

  private

  def home_params
    params.require(:signUp).permit(:firstName, :lastName, :email, :institution, :usage)
  end
end
