require "rails_helper"
require "webmock/rspec"

RSpec.describe Auth0Controller, type: :request do
  create_users

  context "Anon User" do
    it "request to protected endpoint should fail if user is not logged in" do
      post projects_url, params: { project: { name: "New Project" } }
      expect(response).to redirect_to(new_user_session_url)
    end

    it "request to protected endpoint should fail if user has already logged out" do
      sign_in_auth0 @joe
      post destroy_user_session_path
      post projects_url, params: { project: { name: "New Project" } }
      expect(response).to redirect_to(new_user_session_url)
    end
  end

  context "Signed in User" do
    before do
      sign_in @joe
    end

    it "should redirect user to auth0 login" do
      get new_user_session_path
      expect(response).to redirect_to(url_for(controller: :auth0, action: :refresh_token, params: { mode: "login" }, only_path: true))
    end

    it "should redirect user to auth0 log out url when logging out" do
      sign_in @joe
      post destroy_user_session_path
      expect("https://#{ENV['AUTH0_DOMAIN']}/v2/logout").to eq(response.redirect_url.split("?").first)
    end
  end

  context "Using auth0_management_client_double" do
    it "should increment login counter" do
      setup_auth0_double
      previous_count = User.find(@joe.id).sign_in_count
      sign_in_auth0 @joe
      new_count = User.find(@joe.id).sign_in_count
      expect(previous_count + 1).to eq(new_count)
    end
  end
end
