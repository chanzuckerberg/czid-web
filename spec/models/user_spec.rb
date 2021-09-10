require 'rails_helper'

LAUNCHED_FEATURES = ["feature_1", "feature_2"].freeze
USER_FEATURES = ["feature_1", "feature_3"].freeze

describe User, type: :model do
  context "#allowed_feature_list" do
    subject { user.allowed_feature_list }

    context "if user has allowed features" do
      let(:user) { create(:user, allowed_features: JSON.dump(USER_FEATURES)) }

      context "if launched features configured" do
        let!(:app_config) { create(:app_config, key: AppConfig::LAUNCHED_FEATURES, value: JSON.dump(LAUNCHED_FEATURES)) }
        it "shows merged features" do
          expect(subject).to contain_exactly("feature_1", "feature_2", "feature_3")
        end
      end

      context "if launched features is nil" do
        it "returns only user allowed features" do
          expect(subject).to contain_exactly("feature_1", "feature_3")
        end
      end
    end

    context "if user has nil allowed features " do
      let(:user) { create(:user) }
      let!(:app_config) { create(:app_config, key: AppConfig::LAUNCHED_FEATURES, value: JSON.dump(LAUNCHED_FEATURES)) }

      it "return only launched features" do
        expect(subject).to contain_exactly("feature_1", "feature_2")
      end
    end
  end

  context "#salt" do
    subject { user.salt }

    before do
      @user = create(:user)
    end

    let!(:user) { @user }

    it "generates a salt for the user" do
      expect(subject.length).to eq(24)
    end
  end
end
