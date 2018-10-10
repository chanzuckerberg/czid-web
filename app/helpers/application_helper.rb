require 'csv'
require 'json'
require 'open3'

module ApplicationHelper
  def sanitize(user_input_text)
    user_input_text.gsub(/[^A-Za-z0-9_\- ]/, '-')
  end

  def safe_s3_rm(s3_path)
    Open3.capture3("aws", "s3", "rm", s3_path)
  end

  def safe_s3_cp(source_s3_path, destination_s3_path)
    Open3.capture3("aws", "s3", "cp", source_s3_path, destination_s3_path)
  end

  def rds_host
    Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  end

  def hash_array_json2csv(input_file, output_file, keys)
    CSV.open(output_file, "w") do |csv|
      JSON.parse(File.open(input_file).read).each do |hash|
        csv << hash.values_at(*keys)
      end
    end
  end

  def escape_json(hash)
    # using json_escape to prevent XSS vulnerability
    str = json_escape(hash.to_json) unless hash.class == 'String'
    str = str.gsub!("\\", "\\\\\\") if str.include? "\\"
    str = str.gsub("'", "\\\\'")
    str
  end
end
