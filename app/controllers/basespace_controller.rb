BASESPACE_OAUTH_URL = ["https://api.basespace.illumina.com/v1pre3/oauthv2/token",
                       BASESPACE_CURRENT_PROJECTS_URL = "https://api.basespace.illumina.com/v1pre3/users/current/projects".freeze].freeze
BASESPACE_PROJECT_DATASETS_URL = "https://api.basespace.illumina.com/v2/projects/%s/datasets".freeze
# The maximum number of items to fetch from a Basespace API endpoint at one time.
# If we don't set this, it defaults to 10.
# TODO(mark): Implement a way to automatically fetch additional pages if necessary.
BASESPACE_PAGE_SIZE = 1024

class BasespaceController < ApplicationController
  include HttpHelper

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

    # 1024 is the maximum limit allowed by Basespace.
    # If users reach this limit, we will need to implement multiple requests to fetch all the projects.
    response = HttpHelper.get_json(
      BASESPACE_CURRENT_PROJECTS_URL,
      { limit: BASESPACE_PAGE_SIZE },
      "Authorization" => "Bearer #{access_token}"
    )

    if response.nil? || response["Response"].nil? || response["Response"]["Items"].nil?
      render json: {
        error: "unable to fetch data from basespace"
      }
      return
    end

    # Just return selected fields.
    formatted_projects = response["Response"]["Items"].map do |dataset|
      {
        id: dataset["Id"],
        name: dataset["Name"]
      }
    end

    render json: formatted_projects
  end

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

    # 1024 is the maximum limit allowed by Basespace.
    # If users reach this limit, we will need to implement multiple requests to fetch all the samples.
    response = HttpHelper.get_json(
      BASESPACE_PROJECT_DATASETS_URL % basespace_project_id,
      { limit: BASESPACE_PAGE_SIZE },
      "Authorization" => "Bearer #{access_token}"
    )

    if response.nil? || response["Items"].nil?
      render json: {
        error: "unable to fetch data from basespace"
      }
      return
    end

    # Just return selected fields.
    formatted_samples = response["Items"].map do |dataset|
      {
        basespace_dataset_id: dataset["Id"],
        name: dataset["Name"],
        file_size: dataset["TotalSize"],
        file_type: get_dataset_file_type(dataset),
        basespace_project_id: basespace_project_id,
        basespace_project_name: dataset["Project"]["Name"]
      }
    end

    # Remove all non-FASTQ files.
    # We will add other file types as we encounter them.
    formatted_samples = formatted_samples.select { |dataset| dataset[:file_type].present? }

    render json: formatted_samples
  end

  private

  def get_dataset_file_type(dataset)
    if dataset["DatasetType"].present? && dataset["DatasetType"]["Name"].downcase.include?("fastq")
      if dataset["Attributes"].present? && dataset["Attributes"]["common_fastq"].present? && dataset["Attributes"]["common_fastq"]["IsPairedEnd"] == true
        return "Paired-end FASTQ"
      else
        return "Single-end FASTQ"
      end
    end

    return nil
  end
end
