require 'csv'
require 'json'

module ApplicationHelper
  def rds_host
    Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  end

  def warden
    request.env['warden']
  end

  def current_user
    warden&.user(:auth0_user)
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

  def user_context
    {
      admin: current_user ? current_user.role == 1 : false,
      allowedFeatures: current_user && current_user.allowed_feature_list,
      appConfig: AppConfigHelper.configs_for_context(),
      userSettings: current_user && current_user.viewable_user_settings,
    }
  end

  HUMAN_TAX_IDS = [9605, 9606].freeze
end
