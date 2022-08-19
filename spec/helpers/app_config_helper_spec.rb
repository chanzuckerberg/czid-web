require "rails_helper"
require "webmock/rspec"

RSpec.describe AppConfigHelper, type: :helper do
  describe "get_app_config" do
    context "when key exists" do
      it "returns the value" do
        config_key = "test_key_to_get"
        AppConfigHelper.set_app_config(config_key, "1")
        expect(AppConfigHelper.get_app_config(config_key)).to eq("1")
      end
    end

    context "when key does not exist" do
      it "returns default_value is passed in" do
        expect(AppConfigHelper.get_app_config("nonexistant_key_for_get", "0")).to eq("0")
      end

      it "returns nil when no default_value is passed in" do
        expect(AppConfigHelper.get_app_config("nonexistant_key_for_get")).to be_nil
      end
    end
  end

  describe "#set_app_config" do
    context "when key does not exist" do
      it "adds new key with given value" do
        new_key = "new_config_key"
        expect { AppConfigHelper.set_app_config(new_key, "1") }.to change(AppConfig, :count).by(1)
        expect(AppConfig.find_by(key: new_key).value).to eq("1")
      end
    end

    context "when key does already exists" do
      it "adds new key with given value" do
        existing_key = "existing_config_key"
        AppConfigHelper.set_app_config(existing_key, "0")
        expect { AppConfigHelper.set_app_config(existing_key, "1") }.to change(AppConfig, :count).by(0)
        expect(AppConfig.find_by(key: existing_key).value).to eq("1")
      end
    end
  end

  describe "#remove_app_config" do
    it "removes AppConfig with the given key" do
      test_config_key = "test_key_to_delete"
      test_config_value = "0"
      AppConfigHelper.set_app_config(test_config_key, test_config_value)

      expect(Rails.logger).to receive(:info).with("[AppConfigHelper#remove_app_config] removing key '#{test_config_key}' with value '#{test_config_value}'")
      expect(Rails.cache).to receive(:delete).with("app_config-#{test_config_key}")
      expect { AppConfigHelper.remove_app_config(test_config_key) }.to change(AppConfig, :count).by(-1)
      expect(AppConfig.find_by(key: test_config_key)).to be_nil
    end

    it "logs an error when key does not exist" do
      invalid_key = "does_not_exist"
      expect(Rails.logger).to receive(:error).with("[AppConfigHelper#remove_app_config] could not find key '#{invalid_key}'")
      AppConfigHelper.remove_app_config(invalid_key)
    end
  end
end
