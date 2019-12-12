require "rails_helper"
require "webmock/rspec"

RSpec.describe Auth0Helper, type: :helper do
  describe "#auth0_check_user_auth" do
    subject { helper.auth0_check_user_auth current_user }

    context "when user is blank" do
      let(:current_user) { nil }
      it { is_expected.to eq(Auth0Helper::AUTH_INVALID_USER) }
    end

    context "when checking any user" do
      let(:current_user) { build_stubbed(:joe) }
      before { expect(helper).to receive(:auth0_decode_auth_token).and_return(decoded_token) }

      context "and token is expired" do
        let(:decoded_token) { { authenticated: false } }
        it { is_expected.to eq(Auth0Helper::AUTH_TOKEN_EXPIRED) }
      end

      context "and token is not expired" do
        context "and user email doesn't match" do
          let(:decoded_token) { { authenticated: true, auth_payload: { "email" => "wrong" + current_user.email } } }
          it { is_expected.to eq(Auth0Helper::AUTH_INVALID_USER) }
        end
        context "and user matches" do
          let(:decoded_token) { { authenticated: true, auth_payload: { "email" => current_user.email } } }
          it { is_expected.to eq(Auth0Helper::AUTH_VALID) }
        end
      end
    end

    context "when checking an admin user" do
      let(:current_user) { build_stubbed(:admin) }
      before { expect(helper).to receive(:auth0_decode_auth_token).and_return(decoded_token) }

      context "and role custom claim is not present in JWT" do
        let(:decoded_token) { { authenticated: true, auth_payload: { "email" => current_user.email } } }
        it { is_expected.to eq(Auth0Helper::AUTH_INVALID_USER) }
      end
      context "and role custom claim in JWT doesn't contain admin" do
        let(:decoded_token) { { authenticated: true, auth_payload: { "email" => current_user.email, Auth0Helper::ROLES_CUSTOM_CLAIM => [] } } }
        it { is_expected.to eq(Auth0Helper::AUTH_INVALID_USER) }
      end
      context "and role custom claim in JWT contains admin" do
        let(:decoded_token) { { authenticated: true, auth_payload: { "email" => current_user.email, Auth0Helper::ROLES_CUSTOM_CLAIM => ["admin"] } } }
        it { is_expected.to eq(Auth0Helper::AUTH_VALID) }
      end
    end
  end
end
