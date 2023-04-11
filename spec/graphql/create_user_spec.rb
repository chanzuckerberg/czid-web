require "rails_helper"

RSpec.describe GraphqlController, type: :request do
  create_users

  query =
    <<~GQL
      mutation CreateUser(
        $name: String
        $email: String!
        $institution: String
        $role: Int
        $sendActivation: Boolean
        $archetypes: String
        $segments: String
      ) {
        createUser(
          name: $name
          email: $email
          institution: $institution
          role: $role
          sendActivation: $sendActivation
          archetypes: $archetypes
          segments: $segments
        ) {
          name
          email
          institution
          role
          archetypes
          segments
        }
      }
    GQL

  before do
    allow(Auth0UserManagementHelper).to receive(:create_auth0_user).and_return(
      { "user_id" => 1 }
    )
    allow(Auth0UserManagementHelper).to receive(:get_auth0_password_reset_token).and_return(
      { "ticket" => "auth0_ticket_reset_url" }
    )
    email_message = instance_double(ActionMailer::MessageDelivery)
    allow(email_message).to receive(:deliver_now)
    allow(UserMailer).to receive(:account_activation).and_return(email_message)
  end

  describe ".resolve" do
    let(:fake_user_name) { "Fake Name" }
    let(:fake_email) { "fake@example.com" }
    let(:fake_institution) { "Fake Institution" }
    let(:mock_archetypes) { "[\"Medical Detective\",\"Landscape Explorer\"]" }
    let(:mock_segments) { "[\"DPH\",\"GCE\"]" }

    context "when automatic account creation is disabled" do
      before do
        AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "")
      end

      # Account created via admin-settings
      context "and the current user is an admin" do
        before do
          sign_in @admin
        end

        it "should create a new user" do
          expect do
            post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
              query: query,
              context: { current_user: @admin },
              variables: { name: fake_user_name, email: fake_email, institution: fake_institution, role: 0, sendActivation: true, archetypes: mock_archetypes, segments: mock_segments },
            }.to_json
          end.to change { User.count }.by(1)
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          result = result["data"]["createUser"]
          expect(result).to include_json(
            { name: fake_user_name, email: fake_email, institution: fake_institution, role: 0, archetypes: mock_archetypes, segments: mock_segments }
          )
        end
      end

      context "and the current user is a non-admin" do
        before do
          sign_in @joe
        end

        # This endpoint is not being called in the project-invite flow
        it "should not create a user and raise an error" do
          expect do
            post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
              query: query,
              context: { current_user: @joe },
              variables: { name: fake_user_name, email: fake_email, role: 0, sendActivation: true },
            }.to_json
          end.to change { User.count }.by(0)
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          expect(result).to include_json(
            { "errors" => [{ "message" => "Permission denied" }] }
          )
        end
      end

      context "and the current user is nil (logged out)" do
        it "should not create a user and raise an error" do
          expect do
            post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
              query: query,
              context: { current_user: nil },
              variables: { email: fake_email },
            }.to_json
          end.to change { User.count }.by(0)
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          expect(result).to include_json(
            { "errors" => [{ "message" => "Permission denied" }] }
          )
        end
      end
    end

    context "when automatic account creation is enabled" do
      before do
        AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "1")
      end

      # Account created via admin-settings
      context "and the current user is an admin" do
        before do
          sign_in @admin
        end

        it "should create a new user" do
          expect do
            post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
              query: query,
              context: { current_user: @admin },
              variables: { name: fake_user_name, email: fake_email, institution: fake_institution, role: 0, sendActivation: true, archetypes: mock_archetypes, segments: mock_segments },
            }.to_json
          end.to change { User.count }.by(1)
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          result = result["data"]["createUser"]
          expect(result).to include_json(
            { name: fake_user_name, email: fake_email, institution: fake_institution, role: 0, archetypes: mock_archetypes, segments: mock_segments }
          )
        end
      end

      context "and the current user is a non-admin" do
        before do
          sign_in @joe
        end

        # This endpoint is not being called in the project-invite flow
        it "should not create a user and raise an error" do
          expect do
            post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
              query: query,
              context: { current_user: @joe },
              variables: { name: fake_user_name, email: fake_email, role: 0, sendActivation: true },
            }.to_json
          end.to change { User.count }.by(0)
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          expect(result).to include_json(
            { "errors" => [{ "message" => "Permission denied" }] }
          )
        end
      end

      # Account created via landing page
      context "and the current user is nil (logged out)" do
        it "should create a user with only an email" do
          expect do
            post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
              query: query,
              context: { current_user: nil },
              variables: { email: fake_email },
            }.to_json
          end.to change { User.count }.by(1)
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          result = result["data"]["createUser"]
          expect(result).to include_json(
            { name: nil, email: fake_email, institution: nil, role: 0, archetypes: nil, segments: nil }
          )
        end
      end
    end
  end
end
