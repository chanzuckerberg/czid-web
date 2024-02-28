require 'rails_helper'

RSpec.describe TokenCreationService, type: :service do
  create_users

  before do
    sign_in @joe
    @identity_controller = IdentityController.new

    other_user = create(:user)
    @owner_project = create(:project, creator_id: @joe.id) # owner
    @member_project = create(:project, creator_id: other_user.id, users: [@joe]) # member
    @viewer_project = create(:public_project, :with_public_sample) # viewer
  end

  describe '#call' do
    context "when user_id is provided" do
      let(:inputs) { { user_id: @joe.id } }
      it "should include the user_id in the token" do
        generated_token = TokenCreationService.call(**inputs)["token"]
        decrypted_token = @identity_controller.send(:decrypt_token, generated_token)

        expect(decrypted_token["sub"]).to eq(inputs[:user_id].to_s)
      end
    end

    context "when user_id and should_include_project_claims are provided" do
      let(:inputs) { { user_id: @joe.id, should_include_project_claims: true } }
      it "should include the user_id and project claims in the token" do
        generated_token = TokenCreationService.call(**inputs)["token"]
        decrypted_token = @identity_controller.send(:decrypt_token, generated_token)
        project_roles = decrypted_token["project_roles"]

        expect(decrypted_token["sub"]).to eq(inputs[:user_id].to_s)
        expect(project_roles["owner"]).to eq([@owner_project.id])
        expect(project_roles["member"]).to eq([@member_project.id])
        expect(project_roles["viewer"]).to eq([@member_project.id, @viewer_project.id])
      end
    end

    context "when service_identity is provided" do
      let(:inputs) { { service_identity: "workflows" } }
      it "should include the service_identity in the token" do
        generated_token = TokenCreationService.call(**inputs)["token"]
        decrypted_token = @identity_controller.send(:decrypt_token, generated_token)

        expect(decrypted_token["service_identity"]).to eq(inputs[:service_identity])
      end
    end

    context "when expires_after is provided" do
      let(:inputs) { { user_id: @joe.id, service_identity: true, expires_after: 600 } }
      it "should include the correct expiration time in the token" do
        generated_token = TokenCreationService.call(**inputs)["token"]
        now = Time.zone.now
        decrypted_token = @identity_controller.send(:decrypt_token, generated_token)

        expect(Time.zone.at(decrypted_token["exp"].to_i)).to be_within(2.seconds).of(now + 600)
      end
    end
  end
end
