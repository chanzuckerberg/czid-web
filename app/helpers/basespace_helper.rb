require 'open-uri'

# TODO(mark): Investigate if there is a way to fetch the user's current projects with v2 API. No obvious way from the docs.
BASESPACE_CURRENT_PROJECTS_URL = "https://api.basespace.illumina.com/v1pre3/users/current/projects".freeze
BASESPACE_PROJECT_DATASETS_URL = "https://api.basespace.illumina.com/v2/projects/%s/datasets".freeze
BASESPACE_DATASET_FILES_URL = "https://api.basespace.illumina.com/v2/datasets/%s/files?filehrefcontentresolution=true".freeze
BASESPACE_DELETE_ACCESS_TOKEN_URL = "https://api.basespace.illumina.com/v2/oauthv2tokens/current".freeze
# 1024 is the maximum limit allowed by Basespace.
# If users reach this limit, we will need to implement multiple requests to fetch all the samples.
BASESPACE_PAGE_SIZE = 1024

module BasespaceHelper
  def revoke_access_token(access_token)
    HttpHelper.delete(
      BASESPACE_DELETE_ACCESS_TOKEN_URL,
      "x-access-token" => access_token
    )
  end

  def verify_access_token_revoked(access_token, sample_id)
    # Verify that the token was revoked by using it to call an API endpoint.

    fetch_from_basespace(BASESPACE_CURRENT_PROJECTS_URL, access_token, {}, true)

    # If we reach this step, the access token must not have been revoked.
    LogUtil.log_error(
      "BasespaceAccessTokenError: Failed to revoke access token for sample id #{sample_id}",
      access_token: access_token,
      sample_id: sample_id
    )
  rescue HttpHelper::HttpError => e
    # We expect the API endpoint to return a 401.
    if e.status_code == 401
      Rails.logger.info("Revoke access token check succeeded")
    else
      raise e
    end
  end

  # In one instance, we send a request expecting it to fail. So we provide a silence_errors option.
  def fetch_from_basespace(url, access_token, params = {}, silence_errors = false)
    HttpHelper.get_json(
      url,
      params.merge(limit: BASESPACE_PAGE_SIZE),
      { "Authorization" => "Bearer #{access_token}" },
      silence_errors
    )
  end

  module_function :revoke_access_token, :verify_access_token_revoked, :fetch_from_basespace

  def basespace_projects(access_token)
    begin
      response = fetch_from_basespace(BASESPACE_CURRENT_PROJECTS_URL, access_token)

      if response.dig("Response", "Items").nil?
        if response.dig("ResponseStatus", "Message").present?
          LogUtil.log_error(
            "Fetch Basespace projects failed with error: #{response['ResponseStatus']['Message']}",
            access_token: access_token,
            response: response
          )
        else
          LogUtil.log_error("Failed to fetch Basespace projects", access_token: access_token, response: response)
        end
        return nil
      end
    rescue StandardError
      LogUtil.log_error("Failed to fetch Basespace projects", access_token: access_token)
      return nil
    end

    # Just return selected fields.
    response["Response"]["Items"].map do |dataset|
      {
        id: dataset["Id"],
        name: dataset["Name"],
      }
    end
  end

  def samples_for_basespace_project(project_id, access_token)
    begin
      response = fetch_from_basespace(BASESPACE_PROJECT_DATASETS_URL % project_id, access_token)

      if response["Items"].nil?
        if response["ErrorMessage"].present?
          LogUtil.log_error(
            "Fetch samples for Basespace project failed with error: #{response['ErrorMessage']}",
            project_id: project_id,
            access_token: access_token,
            response: response
          )
        else
          LogUtil.log_error(
            "Failed to fetch samples for Basespace project",
            project_id: project_id,
            access_token: access_token,
            response: response
          )
        end
        return nil
      end
    rescue StandardError
      LogUtil.log_error(
        "Failed to fetch samples for Basespace project",
        project_id: project_id,
        access_token: access_token
      )
      return nil
    end

    # Just return selected fields.
    formatted_samples = response["Items"].map do |dataset|
      {
        basespace_dataset_id: dataset["Id"],
        name: dataset["Name"],
        file_size: dataset["TotalSize"],
        file_type: get_dataset_file_type(dataset),
        basespace_project_id: project_id,
        basespace_project_name: dataset["Project"]["Name"],
      }
    end

    # Remove all non-FASTQ files.
    # We will add other file types as we encounter them.
    formatted_samples.select { |dataset| dataset[:file_type].present? }
  end

  def files_for_basespace_dataset(dataset_id, access_token)
    begin
      response = fetch_from_basespace(BASESPACE_DATASET_FILES_URL % dataset_id, access_token, filehrefcontentresolution: "true")

      if response["Items"].nil?
        if response["ErrorMessage"].present?
          LogUtil.log_error(
            "Fetch files for Basespace dataset failed with error: #{response['ErrorMessage']}",
            dataset_id: dataset_id,
            access_token: access_token,
            response: response
          )
        else
          LogUtil.log_error(
            "Failed to fetch files for basespace dataset",
            dataset_id: dataset_id,
            access_token: access_token,
            response: response
          )
        end
        return nil
      end
    rescue StandardError
      LogUtil.log_error(
        "Failed to fetch files for basespace dataset",
        dataset_id: dataset_id,
        access_token: access_token
      )
      return nil
    end

    return response["Items"].map do |file|
      {
        name: file["Name"],
        # Path to download the file. Includes all auth information to download the file.
        download_path: file["HrefContent"],
        # Store the file id for debugging purposes.
        # Without a valid access token, the file cannot be accessed using the file id.
        source_path: file["Href"],
      }
    end
  end

  def upload_from_basespace_to_s3(basespace_path, s3_path, file_name)
    # Run the piped commands and save stderr
    success, stderr = Syscall.pipe(
      # Don't show the cURL progress bar, but do show any errors.
      # Fail if the HTTP status code is an error.
      ["curl", "--fail", "-s", "--show-error", basespace_path],
      ["aws", "s3", "cp", "-", "#{s3_path}/#{file_name}"]
    )

    unless success
      LogUtil.log_error(
        "Failed to transfer file from basespace to #{s3_path} for #{file_name}: #{stderr}",
        basespace_path: basespace_path,
        s3_path: s3_path,
        file_name: file_name
      )
    end

    return success
  end

  private

  def get_dataset_file_type(dataset)
    if dataset.present? && dataset["DatasetType"].present? && dataset["DatasetType"]["Name"].downcase.include?("fastq")
      if dataset.dig("Attributes", "common_fastq", "IsPairedEnd") == true
        return "Paired-end FASTQ"
      else
        return "Single-end FASTQ"
      end
    end

    return nil
  end
end
