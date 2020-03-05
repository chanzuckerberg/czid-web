require 'will_paginate/array'

class HomeController < ApplicationController
  include SamplesHelper
  before_action :login_required, except: [:landing, :sign_up, :maintenance]
  before_action :admin_required, only: [:all_data]
  skip_before_action :authenticate_user!, :verify_authenticity_token, only: [:landing, :sign_up, :maintenance]
  skip_before_action :check_for_maintenance, only: [:maintenance, :landing, :sign_up]
  power :projects, except: [:landing, :sign_up, :maintenance]

  # Public unsecured landing page
  def landing
    if current_user
      # Call secure home#index path if authenticated
      redirect_to home_path
    else
      @show_bulletin = false
      if get_app_config(AppConfig::SHOW_LANDING_VIDEO_BANNER) == "1"
        @show_bulletin = true
      else
        time_zone = ActiveSupport::TimeZone.new("Pacific Time (US & Canada)")
        start_time = time_zone.parse("2018-10-16 05:00:00")
        end_time = time_zone.parse("2018-12-05 11:30:00")
        if start_time < Time.now.utc && Time.now.utc < end_time
          @show_bulletin = true
        end
      end

      @show_public_site = false
      if get_app_config(AppConfig::SHOW_LANDING_PUBLIC_SITE_BANNER) == "1"
        @show_public_site = true
      end

      render 'landing'
    end
  end

  def index
    project_id = params[:project_id]
    project = project_id.present? ? Project.find(params[:project_id]) : nil

    if project.blank?
      redirect_to my_data_path
    elsif current_user.owns_project?(project.id)
      redirect_to action: "my_data", project_id: project_id
    elsif project.public_access != 0
      redirect_to action: "public", project_id: project_id
    elsif current_user.admin?
      redirect_to action: "all_data", project_id: project_id
    else
      redirect_to my_data_path
    end
  end

  def legacy
    @favorite_projects = current_user.favorites
    @projects = current_power.projects
    @editable_project_ids = current_power.updatable_projects.pluck(:id)
    @host_genomes = HostGenome.all.reject { |hg| hg.name.downcase.include?("__test__") }
    @user_is_admin = current_user.role == 1 ? 1 : 0
    @background_models = current_power.backgrounds
    render 'legacy'
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
      status: 'ok',
    }
  end

  def sign_up
    # Send sign up email with filled out information
    required = [:firstName, :lastName, :email, :institution]
    unless required.all? { |r| home_params.key?(r.to_s) && home_params[r].present? }
      render json: {}, status: :not_acceptable
      return
    end

    begin
      UserMailer.account_request_reply(home_params[:email]).deliver_now
    rescue => err
      LogUtil.log_err_and_airbrake("account_request_reply(#{home_params[:email]} failed")
      LogUtil.log_backtrace(err)
    end

    body = ""
    home_params.each do |k, v|
      body += "#{k}: #{v}\n"
    end
    Rails.logger.info("New sign up:\n#{body}")
    # DEPRECATED. Use log_analytics_event.
    MetricUtil.put_metric_now("users.sign_ups", 1)
    MetricUtil.log_analytics_event("user_interest_form_submitted", nil, home_params.to_hash, request)

    UserMailer.landing_sign_up_email(body).deliver_now
    send_sign_up_to_airtable(home_params)

    render json: {
      status: :ok,
    }
  rescue => e
    Rails.logger.warn("Sign up error: #{e}")
    render json: {
      status: :internal_server_error,
    }
  end

  def maintenance
    if get_app_config(AppConfig::DISABLE_SITE_FOR_MAINTENANCE) != "1"
      redirect_to root_path
    else
      @show_blank_header = true
    end
  end

  private

  def home_params
    params.require(:signUp).permit(:firstName, :lastName, :email, :institution, :usage)
  end

  def landing_params
    params.permit(:show_bulletin)
  end

  def send_sign_up_to_airtable(params)
    table_name = "Landing Page Form"
    data = {
      fields: {
        firstName: params[:firstName] || "",
        lastName: params[:lastName] || "",
        email: params[:email] || "",
        institution: params[:institution] || "",
        usage: params[:usage] || "",
      },
    }
    MetricUtil.post_to_airtable(table_name, data.to_json)
  end
end
