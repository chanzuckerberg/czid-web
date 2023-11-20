require 'rails_helper'

RSpec.describe IdentityController, type: :controller do
  create_users

  before do
    sign_in @joe
    # Generate a private key and store in tmp
    Open3.capture3("openssl ecparam -name secp384r1 -genkey -noout -out /tmp/czid-private-key.pem")
  end

  describe "GET #identify" do
    def decrypt_token(token)
      stdout, = Open3.capture3(
        "python3", "./scripts/token_auth.py", "--decrypt_token", "--token", token
      )

      JSON.parse(stdout)
    end

    it "creates an auth token with the user_id correctly encoded" do
      get :identify
      json_response = JSON.parse(response.body)
      token = response.cookies["czid_services_token"]
      expires_at = json_response["expires_at"]

      expect(response).to have_http_status(:success)
      expect(expires_at).to_not be_nil
      expect(token).to_not be_nil

      expect(decrypt_token(token)["sub"]).to eq(@joe.id.to_s)
      expect(decrypt_token(token)["exp"]).to eq(expires_at)
    end
  end
end
