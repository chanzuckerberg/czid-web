class UserSetting < ApplicationRecord
  belongs_to :user

  attr_writer :value

  validate :user_setting_checks

  before_save :serialize_value

  # An example user setting
  EXAMPLE_USER_SETTING = "example_user_setting".freeze
  # Show the option to skip sample processing at the end of the sample upload flow.
  SHOW_SKIP_PROCESSING_OPTION = "show_skip_processing_option".freeze

  # value must be "true" or "false". Can be string or boolean.
  # Booleans will be stored in the database as a serialized string.
  DATA_TYPE_BOOLEAN = "boolean".freeze

  # Stores metadata for various user settings.
  # data_type - specifies the type of data that is being stored. You can perform validations on the data in user_setting_checks.
  # required_allowed_feature - the setting will only be visible if an allowed feature is true.
  METADATA = {
    EXAMPLE_USER_SETTING => {
      default: true,
      description: "An example user setting. User settings can handle any persistent user-specific configurations.",
      data_type: DATA_TYPE_BOOLEAN,
    },
    SHOW_SKIP_PROCESSING_OPTION => {
      default: false,
      description: "Show the option to skip sample processing at the end of the sample upload flow.",
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
        SHOW_SKIP_PROCESSING_OPTION,
      ],
    },
  ].freeze

  # Call this function to get the value for a user setting.
  # This automatically converted the serialized value in the database to the appropriate data type
  # (e.g. converts strings to booleans for boolean data types)
  def value
    if @value.nil? && serialized_value
      @value = deserialized_value
    end
    @value
  end

  def user_setting_checks
    # Verify that the key is listed above.
    unless METADATA.keys.include?(key)
      errors.add(:key, "invalid (#{key})")
      return
    end

    # Validation for various data types.
    data_type = METADATA[key][:data_type]
    if data_type == DATA_TYPE_BOOLEAN
      # We accept both the string and boolean forms of true and false.
      errors.add(:value, "must be true or false for boolean data type (#{value} given)") unless [true, false, "true", "false"].include?(value)
    end
  end

  private

  # Serialize the value to be stored in the database.
  def serialize_value
    unless value.nil?
      self.serialized_value = String(value)
    end
  end

  # Deserialize the serialized_value stored in the database.
  def deserialized_value
    # Convert boolean strings to booleans.
    if METADATA[key] && METADATA[key][:data_type] == DATA_TYPE_BOOLEAN
      return serialized_value == "true"
    end
    return serialized_value
  end
end
