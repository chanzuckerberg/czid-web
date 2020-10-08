class UserSettingsController < ApplicationController
  # User settings is currently admin-only because there aren't any user-facing user settings
  # and it doesn't make sense to show an empty screen.
  # Remove this condition if you are adding an additional user-facing user setting.
  before_action :admin_required

  # GET /user_settings/metadata_by_category
  # Get metadata for user settings that are editable by the user.
  def metadata_by_category
    user_setting_metadata = []
    viewable_keys = current_user.viewable_user_setting_keys

    UserSetting::DISPLAY_CATEGORIES.each do |category|
      viewable_category_keys = category[:settings] & viewable_keys

      unless viewable_category_keys.empty?
        user_setting_metadata << {
          name: category[:name],
          settings: viewable_category_keys.map do |key|
            {
              key: key,
              description: UserSetting::METADATA[key][:description],
              data_type: UserSetting::METADATA[key][:data_type],
            }
          end,
        }
      end
    end

    render json: user_setting_metadata
  rescue StandardError => e
    LogUtil.log_backtrace(e)
    LogUtil.log_err("UserSettingsMetadataFetchError: Unexpected issue fetching user setting metadata: #{e}")
    render json: {
      status: "failure",
      error: e,
    }, status: :internal_server_error
  end

  # POST /user_settings/update
  def update
    current_user.save_user_setting(params[:key], params[:value])

    render json: {
      status: "success",
      key: params[:key],
      value: current_user.get_user_setting(params[:key]),
    }
  rescue StandardError => e
    LogUtil.log_backtrace(e)
    LogUtil.log_err("UserSettingsUpdateError: Unexpected issue updating user settings: #{e}")
    render json: {
      status: "failure",
      error: e,
    }, status: :unprocessable_entity
  end

  def index
  end
end
