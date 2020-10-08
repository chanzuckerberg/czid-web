require 'rails_helper'

RSpec.describe BackgroundsController, type: :controller do
  create_users

  # Admin specific behavior
  context "Normal user" do
    # create_users
    before do
      sign_in @joe
      @project_admin = create(:project, users: [@admin], name: "Project Admin")
      @sample_admin = create(:sample, project: @project_admin, name: "Sample Admin",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_admin_two = create(:sample, project: @project_admin, name: "Sample Admin 2",
                                          pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

      @project_joe = create(:project, users: [@joe], name: "Project Joe")
      @sample_joe = create(:sample, project: @project_joe, name: "Sample Joe",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_joe_two = create(:sample, project: @project_joe, name: "Sample Joe 2",
                                        pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    end

    describe "GET #index" do
      it "should not see backgrounds that don't belong to them" do
        create(:background, name: "Background Joe", user: @joe, pipeline_run_ids: [
                 @sample_joe.first_pipeline_run.id,
                 @sample_joe_two.first_pipeline_run.id,
               ])
        # Normal users should only see backgrounds if they can see all of the samples that are part of the background.
        create(:background, name: "Background Admin", user: @admin, pipeline_run_ids: [
                 @sample_admin.first_pipeline_run.id,
                 @sample_admin_two.first_pipeline_run.id,
               ])
        create(:background, name: "Background Mixed", user: @admin, pipeline_run_ids: [
                 @sample_joe.first_pipeline_run.id,
                 @sample_admin.first_pipeline_run.id,
               ])
        get :index, format: :json
        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).to include_json(backgrounds: [{
                                                name: "Background Joe",
                                              }])
      end
    end
  end
end
