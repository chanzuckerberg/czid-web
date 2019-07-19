BASESPACE_OAUTH_URL = "https://api.basespace.illumina.com/v1pre3/oauthv2/token".freeze

class BasespaceController < ApplicationController
  include HttpHelper
  include BasespaceHelper

  before_action :admin_required

  def oauth
    disable_header_navigation
    @access_token = nil

    if params[:code] &&
       ENV["BASESPACE_OAUTH_REDIRECT_URI"] &&
       ENV["BASESPACE_CLIENT_ID"] &&
       ENV["BASESPACE_CLIENT_SECRET"]
      response = HttpHelper.post_json(
        "https://api.basespace.illumina.com/v1pre3/oauthv2/token",
        "code" => params[:code],
        "redirect_uri" => ENV["BASESPACE_OAUTH_REDIRECT_URI"],
        "client_id" => ENV["BASESPACE_CLIENT_ID"],
        "client_secret" => ENV["BASESPACE_CLIENT_SECRET"],
        "grant_type" => "authorization_code"
      )

      if response.present?
        @access_token = response["access_token"]
      end
    end
  end

  def projects
    access_token = params[:access_token]

    if access_token.nil?
      render json: {
        error: "basespace access token required"
      }
      return
    end

    bs_projects = basespace_projects(access_token)

    if bs_projects.nil?
      render json: {
        error: "unable to fetch data from basespace"
      }
      return
    end

    render json: bs_projects
  end

  # Actually fetches basespace DATASETS, which are collections of related fastq files (such as paired-end files)
  # This roughly corresponds to "samples" in IDseq.
  def samples_for_project
    access_token = params[:access_token]
    basespace_project_id = params[:basespace_project_id]

    if access_token.nil?
      render json: {
        error: "basespace access token required"
      }
      return
    end

    if basespace_project_id.nil?
      render json: {
        error: "basespace project id required"
      }
      return
    end

    bs_samples = samples_for_basespace_project(basespace_project_id, access_token)

    if bs_samples.nil?
      render json: {
        error: "unable to fetch data from basespace"
      }
      return
    end

    render json: bs_samples
  end
end
