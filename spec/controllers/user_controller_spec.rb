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
      let(:fake_user_data) do
        { user: {  role: 0,
                   email: "test_user@idseq.net",
                   institution: "Test institution",
                   name: "Test User Name", } }
      end

      before do
        expect(@auth0_management_client_double)
          .to(receive(:create_user)
            .with(
              fake_user_data.dig(:user, :name),
              connection: "Username-Password-Authentication",
              email: fake_user_data.dig(:user, :email),
              name: fake_user_data.dig(:user, :name),
              password: instance_of(String),
              app_metadata: { roles: [] }
            )
            .and_return("user_id" => "auth0|FAKE_AUTH0_USER_ID"))
      end

      it "adds created_by_user_id" do
        post :create, params: { format: "json", **fake_user_data, send_activation: false }

        expect(response).to have_http_status(:success)
        expect(User.last).to have_attributes(
          **fake_user_data[:user],
          created_by_user_id: @admin.id
        )
      end
    end
  end
end
