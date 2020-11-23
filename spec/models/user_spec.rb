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

  context "#authentication_token" do
    subject { user.authentication_token }

    before do
      @user = create(:user)
    end

    let!(:user) { @user }

    it "generates an encrypted authentication_token for the user" do
      expect(subject.length).to eq(24)
    end

    it "uses the AUTH_TOKEN_SECRET to decrypt" do
      # values are manually computed based on the expected encryption logic and key located in .github/workflows/check.yml and chamber
      @user.authentication_token_encrypted = Base64.decode64("+GO6lyPBZw2xe2H6uTzdvVBbTKOd3/I1wM4Os9xjPQs8WnCwnTgG+gdtPaurq5Fi")
      expect(subject).to eq("V1tn563D3KaVXnEyEoe1TNGd")
    end
  end
end
