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
        token = TokenCreationService.call(user_id: @joe.id)
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
        token = TokenCreationService.call(user_id: @joe.id.to_s)["token"]
        request.headers["Authorization"] = "Bearer #{token}"
      end

      it "enriches the token with project roles" do
        get :enrich_token
        json_response = JSON.parse(response.body)
        enriched_token = json_response["token"]
        decrypted_enriched_token = controller.send(:decrypt_token, enriched_token)
        project_roles = decrypted_enriched_token["project_roles"]

        expect(response).to have_http_status(:success)

        expect(decrypted_enriched_token["sub"]).to eq(@joe.id.to_s)
        expect(Time.zone.at(decrypted_enriched_token["exp"].to_i)).to_not be_nil
        expect(project_roles["owner"]).to eq([@owner_project.id])
        expect(project_roles["member"]).to eq([@member_project.id])
        expect(project_roles["viewer"]).to eq([@member_project.id, @viewer_project.id])
      end

      it "should expire after 5 mins (300 seconds)" do
        get :enrich_token
        now = Time.zone.now
        json_response = JSON.parse(response.body)
        enriched_token = json_response["token"]
        decrypted_enriched_token = controller.send(:decrypt_token, enriched_token)

        expect(Time.zone.at(decrypted_enriched_token["exp"].to_i)).to be_within(2.seconds).of(now + 300)
      end
    end
  end

  describe "GET #impersonate" do
    context "when service_identity is provided" do
      before do
        @owner_project = create(:project, creator_id: @joe.id)
        @service_identity = "workflows"

        service_identity_token = TokenCreationService.call(service_identity: @service_identity)["token"]
        request.headers["Authorization"] = "Bearer #{service_identity_token}"
      end

      it "returns an enriched token with project roles & the service identity" do
        get :impersonate, params: { user_id: @joe.id }
        json_response = JSON.parse(response.body)

        enriched_token = json_response["token"]
        decrypted_enriched_token = controller.send(:decrypt_token, enriched_token)
        project_roles = decrypted_enriched_token["project_roles"]
        service_identity_payload = decrypted_enriched_token["service_identity"]

        expect(response).to have_http_status(:success)

        expect(decrypted_enriched_token["sub"]).to eq(@joe.id.to_s)
        expect(Time.zone.at(decrypted_enriched_token["exp"].to_i)).to_not be_nil
        expect(project_roles["owner"]).to eq([@owner_project.id])
        expect(service_identity_payload).to eq(@service_identity) # service identity is preserved
      end
    end

    context "when service_identity is missing" do
      before do
        @service_identity = ""
        service_identity_token = TokenCreationService.call(service_identity: @service_identity)["token"]
        request.headers["Authorization"] = "Bearer #{service_identity_token}"
      end

      it "raises a InsufficientPrivilegesError" do
        expect do
          get :impersonate, params: { user_id: @joe.id }
        end.to raise_error(IdentityController::InsufficientPrivilegesError)
      end
    end
  end
end
