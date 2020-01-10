class UserSetting < ApplicationRecord
  belongs_to :user
  validate :user_setting_checks

  # An example user setting
  EXAMPLE_USER_SETTING = "example_user_setting".freeze

  # value must be "true" or "false".
  DATA_TYPE_BOOLEAN = "boolean".freeze

  # Stores metadata for various user settings.
  # data_type - specifies the type of data that is being stored. You can perform validations on the data in user_setting_checks.
  # required_allowed_feature - the setting will only be visible if an allowed feature is true.
  METADATA = {
    EXAMPLE_USER_SETTING => {
      default: "true",
      description: "An example user setting. User settings can handle any persistent user-specific configurations.",
      data_type: DATA_TYPE_BOOLEAN,
    },
  }.freeze

  # Governs how the settings will be displayed in the User Settings page on the front-end.
  # Only include user settings that you want the user to be able to modify.
  # Specifies both the order of categories as well as the order of settings within categories.
  DISPLAY_CATEGORIES = [
    {
      name: "Example Category",
      settings: [
        EXAMPLE_USER_SETTING,
      ],
    },
  ].freeze

  def user_setting_checks
    # Verify that the key is listed above.
    unless METADATA.keys.include?(key)
      errors.add(:key, "invalid (#{key})")
      return
    end

    # Validation for various data types.
    data_type = METADATA[key][:data_type]
    if data_type == DATA_TYPE_BOOLEAN
      errors.add(:value, "must be true or false for boolean data type (#{value} given)") unless ["true", "false"].include?(value)
    end
  end
end
