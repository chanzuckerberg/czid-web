require 'rails_helper'

RSpec.describe UsersController, type: :controller do
  create_users

  before do
    # We don't want our tests invoking real auth0 client
    @auth0_management_client_double = double("Auth0Client")
    allow(Auth0UserManagementHelper).to receive(:auth0_management_client).and_return(@auth0_management_client_double)
  end

  # Admin specific behavior
  context "Admin user" do
    before do
      sign_in @admin
    end

    describe "create user" do
      let(:created_user) { create(:user, **fake_user_data[:user]) }

      subject do
        post :create, params: { format: "json", **fake_user_data, send_activation: false }
      end

      before do
        allow(UserFactoryService).to receive(:call).and_return(created_user)
      end

      let(:fake_user_data) do
        { user: {  role: 0,
                   email: "test_user@czid.org",
                   institution: "Test institution",
                   name: "Test User Name", } }
      end

      it "calls UserFactoryService to create user" do
        expect(UserFactoryService).to receive(:call)
        subject
      end

      it "returns a successful HTTP response" do
        subject
        expect(response).to have_http_status(:success)
      end

      it "redirects to edit user path" do
        expect(subject).to render_template "show"
      end

      context "when a Net::SMTPAuthenticationError is raised" do
        it "responds with the error" do
          allow(UserFactoryService).to receive(:call).and_raise(Net::SMTPAuthenticationError)
          subject
          parsed_body = JSON.parse(response.body)
          puts "parsed_body: #{parsed_body}"
          expect(parsed_body).to eq([
                                      "User was successfully created but SMTP email is not configured. Try manual password reset at #{request.base_url}#{users_password_new_path} To enable SMTP, set environment variables for SMTP_USER and SMTP_PASSWORD.",
                                    ])
        end
      end

      context "when a different error is raised" do
        it "responds with the error" do
          allow(UserFactoryService).to receive(:call).and_raise("UserFactoryService error")
          subject
          parsed_body = JSON.parse(response.body)
          puts "parsed_body: #{parsed_body}"
          expect(parsed_body).to eq(["UserFactoryService error"])
        end
      end
    end
  end
end
