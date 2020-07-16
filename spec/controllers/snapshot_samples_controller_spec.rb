require 'rails_helper'

RSpec.describe SnapshotSamplesController, type: :controller do
  before do
    user = create(:user)
    project = create(:project, users: [user])
    @sample = create(:sample, project: project)
  end

  context "view-only sharing disabled" do
    before do
      AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "0")
    end

    describe "GET #show" do
      it "should redirect to login page" do
        get :show, params: { id: @sample.id, share_id: "test_share_id" }
        expect(response).to redirect_to(root_path + "auth0/login")
      end
    end
  end

  context "view-only sharing enabled" do
    before do
      AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
    end

    describe "GET #show" do
      it "should redirect to login page" do
        get :show, params: { id: @sample.id, share_id: "test_share_id" }
        expect(response).to redirect_to(root_path + "auth0/login")
      end
    end
  end
end
