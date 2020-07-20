require 'rails_helper'

RSpec.describe SnapshotLinksController, type: :controller do
  before do
    @user = create(:user)
    @project = create(:project, users: [@user])
    sign_in @user
  end

  context "when snapshot links are allowed" do
    before do
      @user.add_allowed_feature("edit_snapshot_links")
    end

    describe "POST #create" do
      it "should return http success" do
        post :create, params: { project_id: @project.id }
        expect(response).to have_http_status(:success)
      end
    end
  end

  context "when snapshot links are not allowed" do
    describe "POST #create" do
      it "should redirect to root path" do
        post :create, params: { project_id: @project.id }
        expect(response).to redirect_to root_path
      end
    end
  end
end
