require 'rails_helper'

describe UserSetting, type: :model do
  context "saving and serializing values" do
    before do
      @joe = create(:joe)
      stub_const("UserSetting::METADATA",
                 "example_user_setting" => {
                   default: true,
                   description: "An example user setting. User settings can handle any persistent user-specific configurations.",
                   data_type: UserSetting::DATA_TYPE_BOOLEAN,
                 })
    end

    it "should serialize boolean value correctly" do
      user_setting = create(:user_setting, key: "example_user_setting", value: true, user: @joe)

      expect(user_setting.value).to eq(true)
      expect(user_setting.serialized_value).to eq("true")
    end

    it "should deserialize boolean value correctly" do
      user_setting = create(:user_setting, key: "example_user_setting", serialized_value: "false", user: @joe)

      expect(user_setting.value).to eq(false)
      expect(user_setting.serialized_value).to eq("false")
    end
  end
end
