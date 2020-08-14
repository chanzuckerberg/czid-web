require 'rails_helper'

RSpec.describe SnapshotLinksController, type: :controller do
  before do
    @user = create(:user)
    @project = create(:project, users: [@user])
    @sample_one = create(:sample,
                         project: @project,
                         pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @sample_two = create(:sample,
                         project: @project,
                         pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @snapshot_link = create(:snapshot_link,
                            project_id: @project.id,
                            share_id: "test_id",
                            content: { samples: [{ @sample_one.id => { pipeline_run_id: @sample_one.first_pipeline_run.id } }] }.to_json)
  end

  context "when editing snapshot links is allowed" do
    before do
      sign_in @user
      @user.add_allowed_feature("edit_snapshot_links")
    end

    describe "POST #create" do
      it "should return http success" do
        post :create, params: { project_id: @project.id }
        expect(response).to have_http_status(:success)
      end
    end
  end

  context "when editing snapshot links is not allowed" do
    before do
      sign_in @user
    end

    describe "POST #create" do
      it "should redirect to root path" do
        post :create, params: { project_id: @project.id }
        expect(response).to redirect_to root_path
      end
    end
  end

  context "when snapshot sharing is disabled" do
    before do
      AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "0")
    end

    describe "GET #show" do
      it "should redirect to root path" do
        get :show, params: { share_id: @snapshot_link.share_id }
        expect(response).to redirect_to root_path
      end
    end
  end

  context "when snapshot sharing is enabled" do
    before do
      AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
    end

    describe "GET #show" do
      it "should render the snapshot template" do
        get :show, params: { share_id: @snapshot_link.share_id }
        expect(response).to render_template("home/snapshot")
      end
    end
  end
end
