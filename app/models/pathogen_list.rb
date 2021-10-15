class PathogenList < ApplicationRecord
  has_many :pathogen_list_version, dependent: :destroy
  # TODO: Add a validator on :create to ensure there is one global PathogenList.

  def self.parse_pathogen_list_csv(bucket_name, file_path)
    pathogen_list_csv = AwsClient[:s3].get_object(
      bucket: bucket_name,
      key: file_path
    )
    pathogens = CSV.parse(pathogen_list_csv.body.read, headers: true).map(&:to_h)

    required_headers = ["Species", "taxID", "Source", "Footnote"]
    if (required_headers - pathogens.first.keys).empty?
      pathogens
    else
      Rails.logger.error("Missing required header [required headers=#{required_headers}]")
      raise PathogenListHelper::UPDATE_PROCESS_FAILED
    end
  rescue Aws::S3::Errors::NoSuchKey
    Rails.logger.error("Pathogen list file not found [bucket=#{bucket_name} path=#{file_path}]")
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  rescue CSV::MalformedCSVError => err
    Rails.logger.error("Malformed csv [error=#{err}]")
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  rescue StandardError => err
    Rails.logger.error("Failed to parse pathogen list [error=#{err}]")
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
