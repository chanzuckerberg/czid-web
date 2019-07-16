require 'rails_helper'
require 'json'

RSpec.describe PipelineVizController, type: :controller do
  pipeline_run_stages_data = [{
    name: "Host Filtering",
    dag_json: {
      output_dir_s3: "",
      targets: {
        one: ["file1"],
        two: ["file2"],
        three: ["file3"]
      },
      steps: [
        {
          in: ["one"],
          out: "two",
          class: "step_one"
        }, {
          in: ["two"],
          out: "three",
          class: "step_two"
        }
      ],
      given_targets: {
        one: {
          s3_dir: "/1.0"
        }
      }
    }.to_json
  }, {
    name: "Experimental",
    dag_json: {
      output_dir_s3: "",
      targets: {
        three: ["file3"],
        four: ["file4"]
      },
      steps: [
        {
          in: ["three"],
          out: "four",
          class: "step_three"
        }
      ],
      given_targets: {
        three: {
          s3_dir: "/1.0"
        }
      }
    }.to_json
  }]

  expected_stage_results = {
    "stages" => [
      {
        "steps" => [
          {
            "name" => "step_one",
            "input_edges" => [1],
            "output_edges" => [0]
          },
          {
            "name" => "step_two",
            "input_edges" => [0],
            "output_edges" => [2]
          }
        ]
      }, {
        "steps" => [{
          "name" => "step_three",
          "input_edges" => [2],
          "output_edges" => [3]
        }]
      }
    ],
    "edges" => [
      # Edges from intra_stage_edges
      {
        "from" => { "stage_index" => 0, "step_index" => 0 },
        "to" => { "stage_index" => 0, "step_index" => 1 },
        "files" => ["file2"],
        "is_intra_stage" => true
      },
      # Edges from inter_stage_edges
      {
        "from" => nil,
        "to" => { "stage_index" => 0, "step_index" => 0 },
        "files" => ["file1"],
        "is_intra_stage" => false
      },
      {
        "from" => { "stage_index" => 0, "step_index" => 1 },
        "to" => { "stage_index" => 1, "step_index" => 0 },
        "files" => ["file3"],
        "is_intra_stage" => false
      },
      # Edges from add_final_output_edges
      {
        "from" => { "stage_index" => 1, "step_index" => 0 },
        "files" => ["file4"]
      }
    ]
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

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
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
        get :show, params: { sample_id: sample.id }

        expect(response).to have_http_status 401
      end
    end

    describe "GET pipeline stage results from sample with no pipeline stages" do
      it "cannot see stage results" do
        project = create(:public_project)
        sample = create(:sample, project: project)
        get :show, params: { sample_id: sample.id }

        expect(response).to have_http_status 404
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

        expected_stage_results_no_experimental = expected_stage_results.deep_dup
        expected_stage_results_no_experimental["stages"].pop # Remove experimental stage data
        expected_stage_results_no_experimental["edges"].pop(2) # Remove edges in and to experimental stage data
        # Push new outputting edge for first (and now only) stage
        expected_stage_results_no_experimental["edges"].push("from" => { "stage_index" => 0, "step_index" => 1 },
                                                             "files" => ["file3"])

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(expected_stage_results_no_experimental)
      end
    end

    describe "GET pipeline stage results for own sample" do
      it "can see pipeline stage results without the experimental stage results" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project,
                                 pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])

        expected_stage_results_no_experimental = expected_stage_results.deep_dup
        expected_stage_results_no_experimental["stages"].pop # Remove experimental stage data
        expected_stage_results_no_experimental["edges"].pop(2) # Remove edges in and to experimental stage data
        # Push new outputting edge for first (and now only) stage
        expected_stage_results_no_experimental["edges"].push("from" => { "stage_index" => 0, "step_index" => 1 },
                                                             "files" => ["file3"])

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(expected_stage_results_no_experimental)
      end
    end

    describe "GET pipeline stage results for another user\'s private sample" do
      it "cannot access stage results" do
        private_project = create(:project)
        private_sample = create(:sample, project: private_project,
                                         pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])

        get :show, params: { sample_id: private_sample.id }

        expect(response).to have_http_status 404
      end
    end

    describe "GET pipeline stage results from sample with no pipeline stages (nonadmin)" do
      it "cannot see stage results" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project)
        get :show, params: { sample_id: sample.id }

        expect(response).to have_http_status 404
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

        get :show, params: { sample_id: sample.id }

        expect(response).to have_http_status 401
      end
    end
  end
end
