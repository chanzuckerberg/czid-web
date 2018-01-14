require 'csv'
require 'json'

module ApplicationHelper
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
    str = hash.to_json unless hash.class == 'String'
    str = str.gsub!("\\", "\\\\\\") if str.include? "\\"
    str
  end
end
