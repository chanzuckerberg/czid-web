require 'open-uri'

# TODO(mark): Investigate if there is a way to fetch the user's current projects with v2 API. No obvious way from the docs.
BASESPACE_CURRENT_PROJECTS_URL = "https://api.basespace.illumina.com/v1pre3/users/current/projects".freeze
BASESPACE_PROJECT_DATASETS_URL = "https://api.basespace.illumina.com/v2/projects/%s/datasets".freeze
BASESPACE_DATASET_FILES_URL = "https://api.basespace.illumina.com/v2/datasets/%s/files?filehrefcontentresolution=true".freeze
# 1024 is the maximum limit allowed by Basespace.
# If users reach this limit, we will need to implement multiple requests to fetch all the samples.
BASESPACE_PAGE_SIZE = 1024

module BasespaceHelper
  def fetch_from_basespace(url, access_token, params = {})
    HttpHelper.get_json(
      url,
      params.merge(limit: BASESPACE_PAGE_SIZE),
      "Authorization" => "Bearer #{access_token}"
    )
  end

  def basespace_projects(access_token)
    response = fetch_from_basespace(BASESPACE_CURRENT_PROJECTS_URL, access_token)

    if response.nil? || response.dig("Response", "Items").nil?
      if response.present? && response.dig("ResponseStatus", "Message").present?
        LogUtil.log_err_and_airbrake("basespace_projects failed with error: #{response['ResponseStatus']['Message']}")
      end
      return nil
    end

    # Just return selected fields.
    response["Response"]["Items"].map do |dataset|
      {
        id: dataset["Id"],
        name: dataset["Name"]
      }
    end
  end

  def samples_for_basespace_project(project_id, access_token)
    response = fetch_from_basespace(BASESPACE_PROJECT_DATASETS_URL % project_id, access_token)

    if response.nil? || response["Items"].nil?
      if response.present? && response["ErrorMessage"].present?
        LogUtil.log_err_and_airbrake("samples_for_basespace_project failed with error: #{response['ErrorMessage']}")
      end
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
        basespace_project_name: dataset["Project"]["Name"]
      }
    end

    # Remove all non-FASTQ files.
    # We will add other file types as we encounter them.
    formatted_samples.select { |dataset| dataset[:file_type].present? }
  end

  def files_for_basespace_dataset(dataset_id, access_token)
    response = fetch_from_basespace(BASESPACE_DATASET_FILES_URL % dataset_id, access_token, filehrefcontentresolution: "true")

    if response.nil? || response["Items"].nil?
      if response.present? && response["ErrorMessage"].present?
        LogUtil.log_err_and_airbrake("files_for_basespace_dataset failed with error: #{response['ErrorMessage']}")
      end
      return nil
    end

    return response["Items"].map do |file|
      {
        name: file["Name"],
        # Path to download the file. Includes all auth information to download the file.
        download_path: file["HrefContent"],
        # Store the file id for debugging purposes.
        # Without a valid access token, the file cannot be accessed using the file id.
        source_path: file["Href"]
      }
    end
  end

  def upload_from_basespace_to_s3(basespace_path, s3_path, file_name)
    temp_file = Tempfile.new
    success = false

    begin
      # Download the basespace file into a temp file.
      download = open(basespace_path)
      IO.copy_stream(download, temp_file.path.to_s)

      # Upload the temp file to S3.
      upload_success = Syscall.s3_cp(temp_file.path.to_s, "#{s3_path}/#{file_name}")
      # Raise an error if the copy failed.
      raise StandardError, "failed to copy to S3 #{stderr}" unless upload_success

      success = true
    rescue => exception
      LogUtil.log_err_and_airbrake("Failed to transfer file from basespace to #{s3_path} for #{file_name}")
      Rails.logger.error(exception)
    ensure
      temp_file.unlink
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
