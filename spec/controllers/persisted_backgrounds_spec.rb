require "rails_helper"

RSpec.describe PersistedBackgroundsController, type: :controller do
  create_users

  before do
    sign_in @joe
    @project1 = create(:public_project, name: "Test Project 1", users: [@joe])
    @project2 = create(:project, name: "Test Project 2", users: [@joe])
    @project3 = create(:project, name: "Test Project 3", users: [@joe])
    @admin_project = create(:project, name: "Test Project 4", users: [@admin])

    @admin_sample_one = create(:sample,
                               project: @admin_project,
                               pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @admin_sample_two = create(:sample,
                               project: @admin_project,
                               pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @admin_private_background = create(:background, user: @admin, name: "Admin's Private Background", public_access: 0, pipeline_run_ids: [
                                         @admin_sample_one.first_pipeline_run.id,
                                         @admin_sample_two.first_pipeline_run.id,
                                       ])

    @sample_one = create(:sample,
                         project: @project1,
                         pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @sample_two = create(:sample,
                         project: @project1,
                         pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @public_bg = create(:background, user: @joe, name: "Joe's Background", public_access: 1, pipeline_run_ids: [
                          @sample_one.first_pipeline_run.id,
                          @sample_two.first_pipeline_run.id,
                        ])

    @persisted_background1 = create(:persisted_background, user_id: @joe.id, project_id: @project1.id, background_id: @public_bg.id)
    @persisted_background2 = create(:persisted_background, user_id: @joe.id, project_id: @project2.id, background_id: @public_bg.id)
    @persisted_background3 = create(:persisted_background, user_id: @joe.id, project_id: @project3.id, background_id: @public_bg.id)
    @admin_persisted_background = create(:persisted_background, user_id: @admin.id, project_id: @admin_project.id, background_id: @public_bg.id)
  end

  describe "GET index" do
    it "should return only Joe's persisted backgrounds" do
      get :index

      expect(response).to have_http_status :ok
      json_response = JSON.parse(response.body)
      persisted_backgrounds_project_ids = json_response.map { |pb| pb["project_id"] }
      persisted_backgrounds_background_ids = json_response.map { |pb| pb["background_id"] }
      persisted_background_ids = PersistedBackground.where(user_id: @joe.id, project_id: persisted_backgrounds_project_ids).pluck(:id)

      expect(json_response.length).to eq(3)
      expect(persisted_background_ids).to contain_exactly(@persisted_background1.id, @persisted_background2.id, @persisted_background3.id)
      expect(persisted_background_ids).not_to include(@admin_persisted_background.id)
      expect(persisted_backgrounds_background_ids.uniq).to contain_exactly(@public_bg.id)
      expect(persisted_backgrounds_project_ids).to contain_exactly(@project1.id, @project2.id, @project3.id)
    end
  end

  describe "GET show" do
    it "returns the persisted background for a project" do
      get :show, params: { projectId: @project1.id }

      expect(response).to have_http_status :ok
      persisted_background = JSON.parse(response.body)
      persisted_background_record = PersistedBackground.find_by(user_id: @joe.id, project_id: @project1.id)

      expect(persisted_background_record[:id]).to eq(@persisted_background1.id)
      expect(persisted_background_record[:user_id]).to eq(@persisted_background1.user_id)
      expect(persisted_background["project_id"]).to eq(@persisted_background1.project_id)
      expect(persisted_background["background_id"]).to eq(@persisted_background1.background_id)
    end
  end

  describe "POST create" do
    before do
      @new_project = create(:project, name: "New project", users: [@joe])
    end

    context "Joe creates a persisted background for a project that does not already have a persisted background" do
      it "should successfully create the persisted background" do
        post :create, params: { projectId: @new_project.id, backgroundId: @public_bg.id }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body)

        expect(json_response["message"]).to eq("Persisted background successfully created")
        expect(json_response["persisted_background_id"]).not_to eq(nil)
      end
    end

    context "Joe creates a persisted background for a project that already has a persisted background" do
      it "should fail to create the persisted background" do
        create(:persisted_background, user_id: @joe.id, project_id: @new_project.id, background_id: @public_bg.id)
        post :create, params: { projectId: @new_project.id, backgroundId: @public_bg.id }

        expect(response).to have_http_status :unprocessable_entity
        json_response = JSON.parse(response.body)

        expect(json_response["error"]).to eq("Validation failed: User #{@joe.id} already has a background persisted for project #{@new_project.id}")
      end
    end

    context "Joe tries to create a persisted background for another project that he does not have read access to with his own background" do
      it "should fail to create the persisted background" do
        post :create, params: { projectId: @admin_project.id, backgroundId: @public_bg.id }

        expect(response).to have_http_status :unprocessable_entity
        json_response = JSON.parse(response.body)

        expected_error_message = "Validation failed: User #{@joe.id} does not have read access to Project #{@admin_project.id}"
        expect(json_response["error"]).to eq(expected_error_message)
      end
    end

    context "Joe tries to create a persisted background for his project with a background that he does not have read access to" do
      it "shoud fail to create the persisted background" do
        post :create, params: { projectId: @new_project.id, backgroundId: @admin_private_background.id }

        expect(response).to have_http_status :unprocessable_entity
        json_response = JSON.parse(response.body)

        expected_error_message = "Validation failed: User #{@joe.id} does not have read access to Background #{@admin_private_background.id}"
        expect(json_response["error"]).to eq(expected_error_message)
      end
    end

    context "Joe tries to create a persisted background for a project and background that he does not have read access to" do
      it "should fail to create the persisted background" do
        post :create, params: { projectId: @admin_project.id, backgroundId: @admin_private_background.id }

        expect(response).to have_http_status :unprocessable_entity
        json_response = JSON.parse(response.body)

        expected_error_message = "Validation failed: User #{@joe.id} does not have read access to Background #{@admin_private_background.id}, User #{@joe.id} does not have read access to Project #{@admin_project.id}"
        expect(json_response["error"]).to eq(expected_error_message)
      end
    end
  end

  describe "PUT/PATCH update" do
    before do
      @sample_three = create(:sample,
                             project: @project1,
                             pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_four = create(:sample,
                            project: @project1,
                            pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @new_background = create(:background, user: @joe, name: "Joe's New Background", public_access: 1, pipeline_run_ids: [
                                 @sample_three.first_pipeline_run.id,
                                 @sample_four.first_pipeline_run.id,
                               ])
    end

    context "Joe updates a persisted background for his project with his new background" do
      it "should update the persisted background successfully" do
        put :update, params: { projectId: @project1.id, backgroundId: @new_background.id }

        expect(response).to have_http_status :ok
        new_persisted_background = JSON.parse(response.body)

        expect(new_persisted_background["project_id"]).to eq(@project1.id)
        expect(new_persisted_background["background_id"]).to eq(@new_background.id)
      end
    end

    context "Joe updates a persisted background for his project with a background that he does not have read access to" do
      it "should fail to update the persisted background" do
        put :update, params: { projectId: @project1.id, backgroundId: @admin_private_background.id }

        expect(response).to have_http_status :unprocessable_entity
        json_response = JSON.parse(response.body)

        expected_error_message = "Validation failed: User #{@joe.id} does not have read access to Background #{@admin_private_background.id}"
        expect(json_response["error"]).to eq(expected_error_message)
      end
    end

    context "Admin persists a new background a project that Joe already has a persisted background for" do
      before do
        sign_in @admin
      end

      it "should not affect Joe's persisted background" do
        admin_persisted_background = create(:persisted_background, user_id: @admin.id, project_id: @project1.id, background_id: @public_bg.id)
        put :update, params: { projectId: @project1.id, backgroundId: @new_background.id }

        expect(response).to have_http_status :ok
        admin_persisted_background_for_project_one = JSON.parse(response.body)
        admin_persisted_background_for_project_one_record = PersistedBackground.find_by(user_id: @admin.id, project_id: @project1.id)
        joe_persisted_background_for_project_one_record = PersistedBackground.find_by(user_id: @joe.id, project_id: @project1.id)

        expect(joe_persisted_background_for_project_one_record[:user_id]).to eq(@joe.id)
        expect(joe_persisted_background_for_project_one_record[:project_id]).to eq(@project1.id)
        expect(joe_persisted_background_for_project_one_record[:background_id]).to eq(@public_bg.id)

        expect(admin_persisted_background_for_project_one_record[:id]).to eq(admin_persisted_background[:id])
        expect(admin_persisted_background_for_project_one_record[:user_id]).to eq(@admin.id)
        expect(admin_persisted_background_for_project_one["project_id"]).to eq(@project1.id)
        expect(admin_persisted_background_for_project_one["background_id"]).to eq(@new_background.id)
      end
    end
  end
end
