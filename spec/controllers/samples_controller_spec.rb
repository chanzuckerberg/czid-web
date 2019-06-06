require 'rails_helper'

RSpec.describe SamplesController, type: :controller do
  create_users

  pipeline_stages = [{
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

  # Admin specific behavior
  context "Admin user" do
    before do
      sign_in @admin
      @admin.add_allowed_feature("pipeline_viz")
      @admin.save!
    end

    describe "GET pipeline stage results" do
      it "sees all pipeline stage results" do
        project = create(:public_project)
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_stages }])

        get :stage_results, params: { id: sample.id }

        json_response = JSON.parse(response.body)["pipeline_stage_results"]
        expect(json_response.length).to eq(4)
        expect(json_response["Experimental"]).to be_truthy
        pipeline_stages.each do |stage|
          expect(json_response[stage[:name]]).to eq(JSON.parse(stage[:dag_json]))
        end
      end
    end

    describe "GET pipeline stage results without pipeline viz flag enabled" do
      it "cannot see stage results" do
        project = create(:public_project)
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_stages }])

        @admin.remove_allowed_feature("pipeline_viz")
        @admin.save!
        get :stage_results, params: { id: sample.id }

        expect(response).to have_http_status 401
      end
    end
  end

  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      sign_in @joe
      @joe.add_allowed_feature("pipeline_viz")
      @joe.save!
    end

    describe "GET pipeline stage results" do
      it "cannot see pipeline experimental stage results" do
        project = create(:public_project)
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_stages }])

        get :stage_results, params: { id: sample.id }

        json_response = JSON.parse(response.body)["pipeline_stage_results"]
        expect(json_response.length).to eq(3)
        expect(json_response["Experimental"]).to be_nil
        pipeline_stages.each do |stage|
          unless stage[:name] == "Experimental"
            expect(json_response[stage[:name]]).to eq(JSON.parse(stage[:dag_json]))
          end
        end
      end
    end

    describe "GET pipeline stage results for another user\'s private sample" do
      it "cannot access stage results" do
        private_project = create(:project)
        private_sample = create(:sample, project: private_project,
                                         pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_stages }])
        expect do
          get :stage_results, params: { id: private_sample.id }
        end.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
