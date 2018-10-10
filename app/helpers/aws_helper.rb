require 'open3'

module AwsHelper
  def safe_s3_rm(s3_path)
    Open3.capture3("aws", "s3", "rm", s3_path)
  end

  def safe_s3_cp(source_s3_path, destination_s3_path)
    Open3.capture3("aws", "s3", "cp", source_s3_path, destination_s3_path)
  end
end
