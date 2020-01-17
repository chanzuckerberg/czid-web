require 'rails_helper'

RSpec.describe UserSettingsController, type: :controller do
  create_users

  let(:mock_user_setting) { "mock_user_setting" }
  let(:mock_user_setting_description) { "mock_user_setting_description" }
  let(:mock_user_setting_two) { "mock_user_setting_two" }
  let(:mock_user_setting_description_two) { "mock_user_setting_description_two" }
  let(:mock_user_setting_three) { "mock_user_setting_three" }

  def stub_mock_user_setting_metadata(additional_settings = {})
    user_settings = {
      mock_user_setting => {
        default: true,
        description: mock_user_setting_description,
        data_type: UserSetting::DATA_TYPE_BOOLEAN,
      },
      mock_user_setting_two => {
        default: true,
        description: mock_user_setting_description_two,
        data_type: UserSetting::DATA_TYPE_BOOLEAN,
      },
    }.merge!(additional_settings)

    stub_const("UserSetting::METADATA", user_settings)
  end

  def stub_mock_display_categories(additional_settings = [])
    stub_const("UserSetting::DISPLAY_CATEGORIES",
               [
                 name: "Example Category",
                 settings: [
                   mock_user_setting,
                   mock_user_setting_two,
                 ] + additional_settings,
               ])
  end

  # Admin specific behavior
  context "Admin user" do
    # create_users
    before do
      sign_in @admin
    end

    describe "GET metadata_by_category" do
      it "returns viewable display categories" do
        stub_mock_user_setting_metadata()
        stub_mock_display_categories()

        get :metadata_by_category, params: { format: "json" }
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response[0]["name"]).to eq("Example Category")
        expect(json_response[0]["settings"].length).to eq(2)
        expect(json_response[0]["settings"][0]["key"]).to eq(mock_user_setting)
        expect(json_response[0]["settings"][0]["description"]).to eq(mock_user_setting_description)
        expect(json_response[0]["settings"][0]["data_type"]).to eq(UserSetting::DATA_TYPE_BOOLEAN)
        expect(json_response[0]["settings"][1]["key"]).to eq(mock_user_setting_two)
        expect(json_response[0]["settings"][1]["description"]).to eq(mock_user_setting_description_two)
        expect(json_response[0]["settings"][1]["data_type"]).to eq(UserSetting::DATA_TYPE_BOOLEAN)
      end

      it "does not return user settings that aren't specified in display_categories" do
        # Add an additional user setting that isn't in the display categories.
        stub_mock_user_setting_metadata(mock_user_setting_three => {
                                          default: "true",
                                          description: mock_user_setting_description,
                                          data_type: UserSetting::DATA_TYPE_BOOLEAN,
                                        })
        stub_mock_display_categories()

        get :metadata_by_category, params: { format: "json" }
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response[0]["name"]).to eq("Example Category")
        expect(json_response[0]["settings"].length).to eq(2)
      end

      it "does not return user settings with required_allowed_features that the user doesn't have" do
        mock_user_setting_three = "mock_user_setting_three"

        stub_mock_user_setting_metadata(mock_user_setting_three => {
                                          default: "true",
                                          description: mock_user_setting_description,
                                          data_type: UserSetting::DATA_TYPE_BOOLEAN,
                                          required_allowed_feature: "mock_allowed_feature",
                                        })
        stub_mock_display_categories([mock_user_setting_three])

        get :metadata_by_category, params: { format: "json" }
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response[0]["name"]).to eq("Example Category")
        expect(json_response[0]["settings"].length).to eq(2)
      end

      it "does return user settings with required_allowed_features that the user has" do
        stub_mock_user_setting_metadata(mock_user_setting_three => {
                                          default: "true",
                                          description: mock_user_setting_description,
                                          data_type: UserSetting::DATA_TYPE_BOOLEAN,
                                          required_allowed_feature: "mock_allowed_feature",
                                        })
        stub_mock_display_categories([mock_user_setting_three])

        @admin.add_allowed_feature("mock_allowed_feature")

        get :metadata_by_category, params: { format: "json" }
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response[0]["name"]).to eq("Example Category")
        expect(json_response[0]["settings"].length).to eq(3)
      end
    end

    describe "GET update" do
      it "updates user setting" do
        stub_mock_user_setting_metadata()
        stub_mock_display_categories()

        post :update, params: { format: "json", key: mock_user_setting, value: true }

        json_response = JSON.parse(response.body)
        expect(json_response["status"]).to eq("success")
        expect(json_response["key"]).to eq(mock_user_setting)
        expect(json_response["value"]).to eq(true)
      end

      it "throws error if value is invalid for boolean data type" do
        stub_mock_user_setting_metadata()
        stub_mock_display_categories()

        post :update, params: { format: "json", key: mock_user_setting, value: "mock_bad_value" }

        expect(response).to have_http_status :unprocessable_entity
        json_response = JSON.parse(response.body)
        expect(json_response["status"]).to eq("failure")
      end

      it "throws error if value is invalid for key that isn't present in metadata" do
        stub_mock_user_setting_metadata()
        stub_mock_display_categories()

        post :update, params: { format: "json", key: "mock_bad_key", value: true }

        expect(response).to have_http_status :unprocessable_entity
        json_response = JSON.parse(response.body)
        expect(json_response["status"]).to eq("failure")
      end
    end
  end

  context "Joe user" do
    before do
      sign_in @joe
    end

    describe "GET metadata_by_category" do
      it "should not be accessible to non-admins" do
        stub_mock_user_setting_metadata()
        stub_mock_display_categories()

        get :metadata_by_category, params: { format: "json" }
        expect(controller).not_to receive(:metadata_by_category)
        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET update" do
      it "should not be accessible to non-admins" do
        stub_mock_user_setting_metadata()
        stub_mock_display_categories()

        post :update, params: { format: "json", key: mock_user_setting, value: "true" }
        expect(controller).not_to receive(:update)
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
