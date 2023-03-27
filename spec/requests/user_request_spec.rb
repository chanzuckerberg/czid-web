require 'rails_helper'

RSpec.describe "Sample request", type: :request do
  create_users

  describe "/users/update" do
    before do
      sign_in @admin
      allow(Auth0UserManagementHelper).to receive(:patch_auth0_user)
    end

    it "should update user in auth0" do
      old_email = @joe.email
      allow_any_instance_of(User).to receive(:update).and_return(true)
      expect(Auth0UserManagementHelper).to receive(:patch_auth0_user).with(old_email: old_email, email: "newjoe@example.com", name: "New Joe", role: "0")

      put "/users/#{@joe.id}", params: { user: { email: "newjoe@example.com", name: "New Joe", role: 0 } }

      expect(response).to redirect_to(edit_user_path(@joe))
    end
  end
end
