require 'rails_helper'

RSpec.describe SamplesController, type: :controller do
  pipeline_run_stages_data = [{
    name: "Host Filtering",
    dag_json: "{\"key1\": \"value1\"}"
  }, {
    name: "GSNAPL/RAPSEARCH alignment",
    dag_json: "{\"key2\": \"value2\"}"
  }, {
    name: "Post Processing",
    dag_json: "{\"key3\": \"value3\"}"
  }, {
    name: "Experimental",
    dag_json: "{\"key4\": \"value4\"}"
  }]

  expected_stage_results = {
    "pipeline_version" => "1.0",
    "stages" => {
      "Host Filtering" => { key1: "value1", job_status: "COMPLETED" },
      "GSNAPL/RAPSEARCH alignment" => { key2: "value2", job_status: "COMPLETED" },
      "Post Processing" => { key3: "value3", job_status: "COMPLETED" },
      "Experimental" => { key4: "value4", job_status: "COMPLETED" }
    }
  }

  # Admin specific behavior
  context "Admin user" do
    before do
      @admin = create(:admin, allowed_features: ["pipeline_viz"])
      sign_in @admin
    end

    describe "GET pipeline stage results" do
      it "sees all pipeline stage results" do
        project = create(:public_project)
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])

        get :stage_results, params: { id: sample.id }

        json_response = JSON.parse(response.body)["pipeline_stage_results"]
        expect(json_response).to include_json(expected_stage_results)
        expect(json_response.keys).to contain_exactly(*expected_stage_results.keys)
      end
    end

    describe "GET pipeline stage results without pipeline viz flag enabled" do
      it "cannot see stage results" do
        # Create new admin user with a unique email.
        @admin_disabled_flag = create(:admin, email: "admin2@example.com")
        sign_in @admin_disabled_flag

        project = create(:public_project)
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])
        get :stage_results, params: { id: sample.id }

        expect(response).to have_http_status 401
      end
    end
  end

  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      @joe = create(:joe, allowed_features: ["pipeline_viz"])
      sign_in @joe
    end

    describe "GET pipeline stage results for public sample" do
      it "can see pipeline stage results without the experimental stage results" do
        project = create(:public_project)
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])
        expected_stage_results_no_experimental = expected_stage_results.clone()
        expected_stage_results_no_experimental["stages"].delete "Experimental"

        get :stage_results, params: { id: sample.id }

        json_response = JSON.parse(response.body)["pipeline_stage_results"]
        expect(json_response).to include_json(expected_stage_results_no_experimental)
        expect(json_response["stages"]).not_to include_json(Experimental: { key4: "value4" })
        expect(json_response.keys).to contain_exactly(
          *expected_stage_results_no_experimental.keys
        )
      end
    end

    describe "GET pipeline stage results for own sample" do
      it "can see pipeline stage results without the experimental stage results" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])
        expected_stage_results_no_experimental = expected_stage_results.clone()
        expected_stage_results_no_experimental["stages"].delete "Experimental"

        get :stage_results, params: { id: sample.id }

        json_response = JSON.parse(response.body)["pipeline_stage_results"]
        expect(json_response).to include_json(expected_stage_results_no_experimental)
        expect(json_response["stages"]).not_to include_json(Experimental: { key4: "value4" })
        expect(json_response.keys).to contain_exactly(
          *expected_stage_results_no_experimental.keys
        )
      end
    end

    describe "GET pipeline stage results for another user\'s private sample" do
      it "cannot access stage results" do
        private_project = create(:project)
        private_sample = create(:sample, project: private_project,
                                         pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])
        expect do
          get :stage_results, params: { id: private_sample.id }
        end.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    describe "GET pipeline stage results without pipeline viz flag enabled (nonadmin)" do
      it "cannot see stage results" do
        # Create new user with a unique email.
        @joe = create(:joe, email: "joe2@example.com")
        sign_in @joe

        project = create(:public_project)
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])

        get :stage_results, params: { id: sample.id }

        expect(response).to have_http_status 401
      end
    end
  end
end
