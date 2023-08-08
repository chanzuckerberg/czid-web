require "rails_helper"

RSpec.describe GraphqlController, type: :request do
  create_users

  query =
    <<~GQL
      mutation CreateUser(
        $email: String!
      ) {
        createUser(
          email: $email
        ) {
          email
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

      context "and the current user is a non-admin" do
        before do
          sign_in @joe
        end

        subject do
          post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
            query: query,
            context: { current_user: @joe },
            variables: { name: fake_user_name, email: fake_email, role: 0, sendActivation: true },
          }.to_json
        end

        it "should not call UserFactoryService to create a new user" do
          expect(UserFactoryService).not_to receive(:call)

          subject
        end

        # This endpoint is not being called in the project-invite flow
        it "should raise an error" do
          subject
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          expect(result).to include_json(
            { "errors" => [{ "message" => "Permission denied" }] }
          )
        end
      end

      context "and the current user is nil (logged out)" do
        subject do
          post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
            query: query,
            context: { current_user: nil },
            variables: { email: fake_email },
          }.to_json
        end

        it "should not call UserFactoryService to create a new user" do
          expect(UserFactoryService).not_to receive(:call)

          subject
        end

        it "should raise an error" do
          subject
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

      context "and the current user is a non-admin" do
        before do
          sign_in @joe
        end

        subject do
          post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
            query: query,
            context: { current_user: @joe },
            variables: { name: fake_user_name, email: fake_email, role: 0, sendActivation: true },
          }.to_json
        end

        it "should not call UserFactoryService to create a new user" do
          expect(UserFactoryService).not_to receive(:call)

          subject
        end

        # This endpoint is not being called in the project-invite flow
        it "should raise an error" do
          subject
          expect(response).to have_http_status :success

          result = JSON.parse response.body
          expect(result).to include_json(
            { "errors" => [{ "message" => "Permission denied" }] }
          )
        end
      end

      # Account created via landing page
      context "and the current user is nil (logged out)" do
        subject do
          post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
            query: query,
            context: { current_user: nil },
            variables: { name: nil, email: fake_email },
          }.to_json
        end

        context "and the email is unique" do
          it "should call UserFactoryService to create a new user" do
            expect(UserFactoryService).to receive(:call).with(a_collection_including(
                                                                email: fake_email,
                                                                role: 0,
                                                                send_activation: true,
                                                                signup_path: User::SIGNUP_PATH[:self_registered]
                                                              ))

            subject
          end

          it "should return the new user" do
            subject
            expect(response).to have_http_status :success

            result = JSON.parse response.body
            result = result["data"]["createUser"]
            expect(result).to include_json(
              { email: fake_email }
            )
          end
        end

        context "and the email is claimed by an existing user" do
          before do
            @existing_user = create(:user, email: fake_email)
          end

          it "should not call UserFactoryService to create a new user" do
            expect(UserFactoryService).not_to receive(:call)

            subject
          end

          it "should raise an error" do
            subject
            expect(response).to have_http_status :success

            result = JSON.parse response.body
            expect(result).to include_json(
              { "errors" => [{ "message" => "Email has already been taken" }] }
            )
          end
        end
      end
    end
  end
end
