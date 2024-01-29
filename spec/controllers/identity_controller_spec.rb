require 'rails_helper'

RSpec.describe IdentityController, type: :controller do
  create_users

  before do
    sign_in @joe
    # Generate a private key and store in tmp
    Open3.capture3("openssl ecparam -name secp384r1 -genkey -noout -out /tmp/czid-private-key.pem")
  end

  describe "GET #identify" do
    it "creates an auth token with the user_id correctly encoded" do
      get :identify
      json_response = JSON.parse(response.body)
      token = response.cookies["czid_services_token"]
      expires_at = json_response["expires_at"]

      expect(response).to have_http_status(:success)
      expect(expires_at).to_not be_nil
      expect(token).to_not be_nil

      decrypted_token = controller.send(:decrypt_token, token)
      expect(decrypted_token["sub"]).to eq(@joe.id.to_s)
      expect(Time.zone.at(decrypted_token["exp"].to_i)).to eq(expires_at)
    end
  end

  describe "GET #enrich_token" do
    before do
      other_user = create(:user)
      @owner_project = create(:project, creator_id: @joe.id) # owner
      @member_project = create(:project, creator_id: other_user.id, users: [@joe]) # member
      @viewer_project = create(:public_project, :with_public_sample) # viewer
    end

    context "when token is missing" do
      it "raises a TokenNotFoundError" do
        expect do
          get :enrich_token
        end.to raise_error(IdentityController::TokenNotFoundError)
      end
    end

    context "when token is expired" do
      before do
        token = controller.send(:generate_token, @joe.id.to_s)
        # Set the current time to be 1 second after the token expires
        allow(Time.zone).to receive(:now).and_return(Time.zone.at(token["expires_at"].to_i + 1))
        request.headers["Authorization"] = "Bearer #{token['token']}"
      end

      it "raises a ExpiredTokenReceivedError" do
        expect do
          get :enrich_token
        end.to raise_error(IdentityController::ExpiredTokenReceivedError)
      end
    end

    context "when token is valid" do
      before do
        token = controller.send(:generate_token, @joe.id.to_s)["token"]
        request.headers["Authorization"] = "Bearer #{token}"
      end

      it "enriches the token with project roles" do
        get :enrich_token
        json_response = JSON.parse(response.body)
        enriched_token = json_response["token"]
        decrypted_enriched_token = controller.send(:decrypt_token, enriched_token)
        project_roles = decrypted_enriched_token["projects"]

        expect(response).to have_http_status(:success)

        expect(decrypted_enriched_token["sub"]).to eq(@joe.id.to_s)
        expect(Time.zone.at(decrypted_enriched_token["exp"].to_i)).to_not be_nil
        expect(project_roles[@owner_project.id.to_s]).to eq(["owner"])
        expect(project_roles[@member_project.id.to_s]).to eq(["member", "viewer"])
        expect(project_roles[@viewer_project.id.to_s]).to eq(["viewer"])
      end
    end
  end
end
