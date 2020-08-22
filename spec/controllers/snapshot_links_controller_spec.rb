require 'rails_helper'

RSpec.describe SnapshotLinksController, type: :controller do
  before do
    @user = create(:user)
    @unauthorized_user = create(:user)
  end

  context "when the user is logged in" do
    before do
      @empty_project = create(:project, users: [@user])
      @project = create(:project, users: [@user])
      @sample_one = create(:sample,
                           project: @project,
                           pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    end

    describe "POST #create" do
      it "should create a new snapshot link for empty project, if the feature is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        @user.add_allowed_feature("edit_snapshot_links")
        sign_in @user

        existing_share_ids = SnapshotLink.all.pluck(:share_id).to_set
        expect do
          post :create, params: { project_id: @empty_project.id }
        end.to change(SnapshotLink, :count).by(1)

        new_snapshot = SnapshotLink.last
        expect(new_snapshot["project_id"]).to eq(@empty_project.id)
        expect(new_snapshot["creator_id"]).to eq(@user.id)
        expect(new_snapshot["created_at"]).not_to eq(nil)

        # check for expected snapshot share_id
        share_id = new_snapshot["share_id"]
        expect(existing_share_ids.exclude?(share_id)).to be(true)
        expect(share_id.count("^a-zA-Z0-9")).to eq(0)
        expect(share_id.count("ilI1oO0B8S5Z2G6")).to eq(0)
        expect(share_id.length).to eq(20)

        # check for expected snapshot content
        expected_content = { "samples" => [] }
        content = JSON.parse(new_snapshot["content"])
        expect(content).to eq(expected_content)

        # check for expected http_status
        expect(response).to have_http_status(:ok)
      end

      it "should create a new snapshot link for single-sample project, if the feature is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        @user.add_allowed_feature("edit_snapshot_links")
        sign_in @user

        existing_share_ids = SnapshotLink.all.pluck(:share_id).to_set
        expect do
          post :create, params: { project_id: @project.id }
        end.to change(SnapshotLink, :count).by(1)

        new_snapshot = SnapshotLink.last
        expect(new_snapshot["project_id"]).to eq(@project.id)
        expect(new_snapshot["creator_id"]).to eq(@user.id)
        expect(new_snapshot["created_at"]).not_to eq(nil)

        # check for expected snapshot share_id
        share_id = new_snapshot["share_id"]
        expect(existing_share_ids.exclude?(share_id)).to be(true)
        expect(share_id.count("^a-zA-Z0-9")).to eq(0)
        expect(share_id.count("ilI1oO0B8S5Z2G6")).to eq(0)
        expect(share_id.length).to eq(20)

        # check for expected snapshot content
        expected_content = { "samples" =>
          [{ @sample_one.id.to_s => { "pipeline_run_id" => @sample_one.first_pipeline_run.id } }], }
        content = JSON.parse(new_snapshot["content"])
        expect(content).to eq(expected_content)

        # check for expected http_status
        expect(response).to have_http_status(:ok)
      end

      it "should create a new snapshot link for multi-sample project, if the feature is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        @user.add_allowed_feature("edit_snapshot_links")
        sign_in @user
        sample_two = create(:sample,
                            project: @project,
                            pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        existing_share_ids = SnapshotLink.all.pluck(:share_id).to_set
        expect do
          post :create, params: { project_id: @project.id }
        end.to change(SnapshotLink, :count).by(1)

        new_snapshot = SnapshotLink.last
        expect(new_snapshot["project_id"]).to eq(@project.id)
        expect(new_snapshot["creator_id"]).to eq(@user.id)
        expect(new_snapshot["created_at"]).not_to eq(nil)

        # check for expected snapshot share_id
        share_id = new_snapshot["share_id"]
        expect(existing_share_ids.exclude?(share_id)).to be(true)
        expect(share_id.count("^a-zA-Z0-9")).to eq(0)
        expect(share_id.count("ilI1oO0B8S5Z2G6")).to eq(0)
        expect(share_id.length).to eq(20)

        # check for expected snapshot content
        expected_content = { "samples" => [
          { @sample_one.id.to_s => { "pipeline_run_id" => @sample_one.first_pipeline_run.id } },
          { sample_two.id.to_s => { "pipeline_run_id" => sample_two.first_pipeline_run.id } },
        ], }
        content = JSON.parse(new_snapshot["content"])
        expect(content).to eq(expected_content)

        # check for expected http_status
        expect(response).to have_http_status(:ok)
      end

      it "should redirect to root path, if the feature is disabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "0")
        sign_in @user
        post :create, params: { project_id: @project.id }
        expect(response).to redirect_to root_path
      end

      it "should return unauthorized if user doesn't have edit access to the project" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        @unauthorized_user.add_allowed_feature("edit_snapshot_links")
        sign_in @unauthorized_user

        post :create, params: { project_id: @project.id }
        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("You are not authorized to edit view-only sharing settings.")
      end
    end

    describe "DELETE #destroy" do
      before do
        @snapshot_link = create(:snapshot_link,
                                project_id: @project.id,
                                share_id: "test_id",
                                content: { samples: [{ @sample_one.id => { pipeline_run_id: @sample_one.first_pipeline_run.id } }] }.to_json)
      end

      it "should destroy the specified snapshot, if snapshot sharing and the feature is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        @user.add_allowed_feature("edit_snapshot_links")
        sign_in @user

        expect do
          delete :destroy, params: { share_id: @snapshot_link.share_id }
        end.to change(SnapshotLink, :count).by(-1)
      end

      it "should redirect to root path, if the share_id is invalid" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        @user.add_allowed_feature("edit_snapshot_links")
        sign_in @user

        delete :destroy, params: { share_id: "invalid_id" }
        expect(response).to redirect_to root_path
      end

      it "should redirect to root path, if the snapshot sharing is disabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "0")
        @user.add_allowed_feature("edit_snapshot_links")
        sign_in @user

        delete :destroy, params: { share_id: @snapshot_link.share_id }
        expect(response).to redirect_to root_path
      end

      it "should redirect to root path, if the feature is disabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        sign_in @user

        delete :destroy, params: { share_id: @snapshot_link.share_id }
        expect(response).to redirect_to root_path
      end

      it "should return unauthorized if user doesn't have edit access to the project" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        @unauthorized_user.add_allowed_feature("edit_snapshot_links")
        sign_in @unauthorized_user

        delete :destroy, params: { share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("You are not authorized to edit view-only sharing settings.")
      end
    end

    describe "GET #info" do
      before do
        @sample_two = create(:sample,
                             project: @project,
                             pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @project_two = create(:project, users: [@user])
        @project_three = create(:project, users: [@user])
        @empty_snapshot = create(:snapshot_link,
                                 project_id: @project.id,
                                 share_id: "empty_id",
                                 content: { samples: [] }.to_json)
        @single_sample_snapshot = create(:snapshot_link,
                                         project_id: @project_two.id,
                                         share_id: "single_sample_id",
                                         content: { samples: [{ @sample_one.id => { pipeline_run_id: @sample_one.first_pipeline_run.id } }] }.to_json)
        @multi_sample_snapshot = create(:snapshot_link,
                                        project_id: @project_three.id,
                                        share_id: "multi_sample_id",
                                        content: { samples: [
                                          { @sample_one.id => { pipeline_run_id: @sample_one.first_pipeline_run.id } },
                                          { @sample_two.id => { pipeline_run_id: @sample_two.first_pipeline_run.id } },
                                        ], }.to_json)
      end

      it "should return the correct json_response for empty snapshot, if snapshot sharing is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        sign_in @user

        get :info, params: { project_id: @empty_snapshot.project_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["share_id"]).to eq(@empty_snapshot.share_id)
        expect(json_response["num_samples"]).to eq(0)
        expect(json_response["pipeline_versions"]).to eq([])
        expect(json_response["timestamp"]).to eq(@empty_snapshot.created_at.strftime("%b %d, %Y, %-I:%M%P"))
      end

      it "should return the correct json_response for single-sample snapshot, if snapshot sharing is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        sign_in @user

        get :info, params: { project_id: @single_sample_snapshot.project_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["share_id"]).to eq(@single_sample_snapshot.share_id)
        expect(json_response["num_samples"]).to eq(1)
        expect(json_response["pipeline_versions"]).to eq([@sample_one.first_pipeline_run.pipeline_version])
        expect(json_response["timestamp"]).to eq(@single_sample_snapshot.created_at.strftime("%b %d, %Y, %-I:%M%P"))
      end

      it "should return the correct json_response for multi-sample snapshot, if snapshot sharing is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        sign_in @user

        get :info, params: { project_id: @multi_sample_snapshot.project_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["share_id"]).to eq(@multi_sample_snapshot.share_id)
        expect(json_response["num_samples"]).to eq(2)
        expected_pipeline_versions = Set[@sample_one.first_pipeline_run.pipeline_version, @sample_two.first_pipeline_run.pipeline_version].to_a
        expect(json_response["pipeline_versions"]).to eq(expected_pipeline_versions)
        expect(json_response["timestamp"]).to eq(@multi_sample_snapshot.created_at.strftime("%b %d, %Y, %-I:%M%P"))
      end

      it "should return not_found for non-existent snapshot, if snapshot sharing is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        sign_in @user
        no_snapshot_project = create(:project, users: [@user])

        get :info, params: { project_id: no_snapshot_project.id }
        expect(response).to have_http_status(:not_found)

        json_response = JSON.parse(response.body)
        expect(json_response).to eq({})
      end

      it "should redirect to root path, if snapshot sharing is disabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "0")
        sign_in @user

        get :info, params: { project_id: @multi_sample_snapshot.project_id }
        expect(response).to redirect_to root_path
      end

      it "should return unauthorized if user doesn't have edit access to the project" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        sign_in @unauthorized_user

        get :info, params: { project_id: @multi_sample_snapshot.project_id }
        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("You are not authorized to edit view-only sharing settings.")
      end
    end
  end

  context "when the user is logged out" do
    before do
      project = create(:project, users: [@user])
      sample = create(:sample,
                      project: project,
                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @snapshot_link = create(:snapshot_link,
                              project_id: project.id,
                              share_id: "test_id",
                              content: { samples: [{ sample.id => { pipeline_run_id: sample.first_pipeline_run.id } }] }.to_json)
    end

    describe "GET #show" do
      it "should redirect to root path, if snapshot sharing is disabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "0")
        get :show, params: { share_id: @snapshot_link.share_id }
        expect(response).to redirect_to root_path
      end

      it "should render the snapshot template, if snapshot sharing is enabled" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
        get :show, params: { share_id: @snapshot_link.share_id }
        expect(response).to render_template("home/snapshot")
      end
    end
  end
end
