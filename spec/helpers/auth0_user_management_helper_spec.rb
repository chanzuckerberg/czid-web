require "rails_helper"
require "webmock/rspec"

RSpec.describe Auth0UserManagementHelper, type: :helper do
  describe "#unverified_auth0_users" do
    before do
      @auth0_management_client_double = double("Auth0Client")
      allow(Auth0UserManagementHelper).to receive(:auth0_management_client).and_return(@auth0_management_client_double)
    end

    context "when there are no unverified users" do
      before do
        allow(@auth0_management_client_double).to receive(:get_users).and_return([])
      end

      it "should return an empty list" do
        expect(Auth0UserManagementHelper.unverified_auth0_users).to eq([])
      end
    end

    # Note that the auth0 get_users endpoint returns a maximum of 50 users per page.
    context "when there are less than 50 unverified users" do
      before do
        mock_username_password_auth_user = {
          "email" => "test+1@test.com",
          "identities" => [{
            "connection" => "Username-Password-Authentication",
            "user_id" => "1234",
            "provider" => "auth0",
            "isSocial" => false,
          }],
        }
        mock_legacy_user = {
          "email" => "test+2@test.com",
          "identities" => [{
            "connection" => "idseq-legacy-users",
            "user_id" => "5678",
            "provider" => "auth0",
            "isSocial" => false,
          }],
        }
        allow(@auth0_management_client_double).to receive(:get_users).and_return([
                                                                                   mock_username_password_auth_user,
                                                                                   mock_legacy_user,
                                                                                 ])
      end

      it "should return auth0 user ids and emails for unverified users" do
        expected_response = [
          { auth0_user_id: "1234", email: "test+1@test.com" },
          { auth0_user_id: "5678", email: "test+2@test.com" },
        ]
        expect(Auth0UserManagementHelper.unverified_auth0_users).to eq(expected_response)
      end
    end

    context "when there are 50 or more unverified users" do
      before do
        mock_users = []
        51.times do |i|
          mock_users << {
            "email" => "test+#{i}@test.com",
            "identities" => [{
              "connection" => "Username-Password-Authentication",
              "user_id" => i.to_s,
              "provider" => "auth0",
              "isSocial" => false,
            }],
          }
        end
        allow(@auth0_management_client_double).to receive(:get_users).with(a_collection_including(page: 0)).and_return(mock_users[0..49])
        allow(@auth0_management_client_double).to receive(:get_users).with(a_collection_including(page: 1)).and_return(mock_users[50..50])
      end

      it "should return auth0 user ids and emails for unverified users" do
        expected_response = []
        51.times do |i|
          expected_response << { auth0_user_id: i.to_s, email: "test+#{i}@test.com" }
        end
        expect(Auth0UserManagementHelper.unverified_auth0_users).to eq(expected_response)
      end
    end
  end
end
