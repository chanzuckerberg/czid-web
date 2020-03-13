require 'rails_helper'

LAUNCHED_FEATURES = ["feature_1", "feature_2"].freeze
USER_FEATURES = ["feature_1", "feature_3"].freeze

describe User, type: :model do
  context "#allowed_feature_list" do
    let(:user) { create(:user, allowed_features: JSON.dump(USER_FEATURES)) }
    subject { user.allowed_feature_list }

    it "returns both features launched and enabled for user" do
      create(:app_config, key: AppConfig::LAUNCHED_FEATURES, value: JSON.dump(LAUNCHED_FEATURES))
      expect(subject).to contain_exactly("feature_1", "feature_2", "feature_3")
    end

    it "if launched features not configured return only user allowed features" do
      expect(subject).to contain_exactly("feature_1", "feature_3")
    end
  end
end
