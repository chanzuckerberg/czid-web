class PathogenList < ApplicationRecord
  has_many :pathogen_list_version, dependent: :destroy
  # TODO: Add a validator on :create to ensure there is one global PathogenList.

  def self.parse_input_file_csv(bucket_name, file_path, required_headers)
    list_csv = AwsClient[:s3].get_object(
      bucket: bucket_name,
      key: file_path
    )
    parsed_data = CSV.parse(list_csv.body.read, headers: true).map(&:to_h)

    if (required_headers - parsed_data.first.keys).empty?
      parsed_data
    else
      Rails.logger.error("Missing required header [required headers=#{required_headers}]")
      raise PathogenListHelper::UPDATE_PROCESS_FAILED
    end
  rescue Aws::S3::Errors::NoSuchKey
    Rails.logger.error("List file not found [bucket=#{bucket_name} path=#{file_path}]")
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  rescue CSV::MalformedCSVError => err
    Rails.logger.error("Malformed csv [error=#{err}]")
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  rescue StandardError => err
    Rails.logger.error("Failed to parse list [error=#{err}]")
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  end

  def fetch_list_version(version = nil)
    if version.nil?
      # Return the latest version
      list_versions = PathogenListVersion.where(pathogen_list_id: id)
      versions = list_versions.pluck(:version)
      latest_version = versions.max_by { |v| v.split('.').map(&:to_i) }
      list_versions.find_by(version: latest_version)
    else
      PathogenListVersion.find_by(pathogen_list_id: id, version: version)
    end
  end
end
