require 'will_paginate/array'

class HomeController < ApplicationController
  include SamplesHelper
  before_action :login_required, except: [:landing, :sign_up, :maintenance, :page_not_found]
  before_action :admin_required, only: [:all_data] # rubocop:disable Rails/LexicallyScopedActionFilter
  skip_before_action :authenticate_user!, :verify_authenticity_token, only: [:landing, :sign_up, :maintenance, :page_not_found]
  skip_before_action :check_for_maintenance, only: [:maintenance, :landing, :sign_up]
  power :projects, except: [:landing, :sign_up, :maintenance, :page_not_found]

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

      @show_announcement_banner = false
      if get_app_config(AppConfig::SHOW_ANNOUNCEMENT_BANNER) == "1"
        @show_announcement_banner = true
      end

      @show_public_site = false
      if get_app_config(AppConfig::SHOW_LANDING_PUBLIC_SITE_BANNER) == "1"
        @show_public_site = true
      end

      @show_landing_header = true
      # :text is included to avoid errors with bot crawlers
      render 'landing', formats: [:html, :text]
    end
  end

  def landing_v2
    @hide_header = true
    render 'landing'
  end

  def page_not_found
    if current_user
      @show_landing_header = false
    else
      @show_landing_header = true
      render 'page_not_found'
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

  def feedback
    render json: {
      status: 'ok',
    }
  end

  def sign_up
    # Send sign up email with filled out information
    required = [:firstName, :lastName, :email, :institution, :usage]
    unless required.all? { |r| home_params.key?(r.to_s) && home_params[r].present? }
      render json: {}, status: :not_acceptable
      return
    end

    begin
      UserMailer.account_request_reply(home_params[:email]).deliver_now
    rescue StandardError => err
      LogUtil.log_error(
        "account_request_reply(#{home_params[:email]} failed",
        exception: err,
        email: home_params[:email]
      )
    end

    body = ""
    home_params.each do |k, v|
      body += "#{k}: #{v}\n"
    end
    Rails.logger.info("New sign up:\n#{body}")
    # DEPRECATED. Use log_analytics_event.
    MetricUtil.put_metric_now("users.sign_ups", 1)
    MetricUtil.log_analytics_event(EventDictionary::USER_INTEREST_FORM_SUBMITTED, nil, home_params.to_hash, request)

    UserMailer.landing_sign_up_email(body).deliver_now
    send_sign_up_to_airtable(home_params)

    render json: {
      status: :ok,
    }
  rescue StandardError => e
    Rails.logger.warn("Sign up error: #{e}")
    render json: {
      status: :internal_server_error,
    }
  end

  def maintenance
    if disabled_for_maintenance?
      @show_blank_header = true
    else
      redirect_to root_path
    end
  end

  private

  def home_params
    params.require(:signUp).permit(:firstName, :lastName, :email, :institution, :usage)
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
