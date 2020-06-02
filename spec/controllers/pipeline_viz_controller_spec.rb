require 'rails_helper'
require 'json'

FAKE_SFN_EXECUTION_ARN = "fake:sfn:execution:arn".freeze

RSpec.describe PipelineVizController, type: :controller do
  pipeline_run_stages_data = [{
    name: "Host Filtering",
    dag_json: {
      output_dir_s3: "",
      targets: {
        one: ["file1"],
        two: ["file2"],
        three: ["file3"],
      },
      steps: [
        {
          in: ["one"],
          out: "two",
          class: "step_one",
        }, {
          in: ["two"],
          out: "three",
          class: "step_two",
        },
      ],
      given_targets: {
        one: {
          s3_dir: "/1.0",
        },
      },
    }.to_json,
  }, {
    name: "Experimental",
    dag_json: {
      output_dir_s3: "",
      targets: {
        three: ["file3"],
        four: ["file4"],
      },
      steps: [
        {
          in: ["three"],
          out: "four",
          class: "step_three",
        },
      ],
      given_targets: {
        three: {
          s3_dir: "/1.0",
        },
      },
    }.to_json,
  },]

  expected_stage_results = {
    "stages" => [
      {
        "steps" => [
          {
            "name" => "Two",
            "inputEdges" => [0],
            "outputEdges" => [1],
          },
          {
            "name" => "Three",
            "inputEdges" => [1],
            "outputEdges" => [2],
          },
        ],
      }, {
        "steps" => [{
          "name" => "Four",
          "inputEdges" => [2],
          "outputEdges" => [3],
        },],
      },
    ],
    "edges" => [
      {
        "to" => { "stageIndex" => 0, "stepIndex" => 0 },
        "files" => [{ "displayName" => "file1" }],
        "isIntraStage" => false,
      },
      # Edges from inter_stage_edges
      {
        "from" => { "stageIndex" => 0, "stepIndex" => 0 },
        "to" => { "stageIndex" => 0, "stepIndex" => 1 },
        "files" => [{ "displayName" => "file2" }],
        "isIntraStage" => true,
      },
      {
        "from" => { "stageIndex" => 0, "stepIndex" => 1 },
        "to" => { "stageIndex" => 1, "stepIndex" => 0 },
        "files" => [{ "displayName" => "file3" }],
        "isIntraStage" => false,
      },
      # Edges from add_final_output_edges
      {
        "from" => { "stageIndex" => 1, "stepIndex" => 0 },
        "files" => [{ "displayName" => "file4" }],
        "isIntraStage" => false,
      },
    ],
    "status" => "notStarted",
  }

  # Admin specific behavior
  context "Admin user" do
    before do
      @admin = create(:admin)
      sign_in @admin
    end

    describe "GET pipeline viz graph data" do
      it "sees all stages graph data" do
        project = create(:public_project)
        sample = create(
          :sample,
          project: project,
          pipeline_runs_data: [
            {
              pipeline_run_stages_data: pipeline_run_stages_data,
              sfn_execution_arn: FAKE_SFN_EXECUTION_ARN,
            },
          ]
        )

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(expected_stage_results)
        expect(json_response.keys).to contain_exactly(*expected_stage_results.keys)
      end
    end

    describe "GET pipeline viz graph data from sample with no pipeline run" do
      it "cannot see graph data" do
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
      @joe = create(:joe)
      sign_in @joe
    end

    describe "GET pipeline viz graph data for public sample" do
      it "can see pipeline viz graph data without the experimental stage" do
        project = create(:public_project)
        sample = create(
          :sample,
          project: project,
          pipeline_runs_data: [{
            pipeline_run_stages_data: pipeline_run_stages_data,
            sfn_execution_arn: FAKE_SFN_EXECUTION_ARN,
          },]
        )

        expected_stage_results_no_experimental = expected_stage_results.deep_dup
        expected_stage_results_no_experimental["stages"].pop # Remove experimental stage data
        expected_stage_results_no_experimental["edges"].pop(2) # Remove edges in and to experimental stage data
        # Push new outputting edge for first (and now only) stage
        expected_stage_results_no_experimental["edges"].push("from" => { "stageIndex" => 0, "stepIndex" => 1 },
                                                             "files" => [{ "displayName" => "file3" }])

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(expected_stage_results_no_experimental)
      end
    end

    describe "GET pipeline viz graph data for own sample" do
      it "can see pipeline viz graph data without the experimental stage" do
        project = create(:project, users: [@joe])
        sample = create(
          :sample,
          project: project,
          pipeline_runs_data: [{
            pipeline_run_stages_data: pipeline_run_stages_data,
            sfn_execution_arn: FAKE_SFN_EXECUTION_ARN,
          },]
        )

        expected_stage_results_no_experimental = expected_stage_results.deep_dup
        expected_stage_results_no_experimental["stages"].pop # Remove experimental stage data
        expected_stage_results_no_experimental["edges"].pop(2) # Remove edges in and to experimental stage data
        # Push new outputting edge for first (and now only) stage
        expected_stage_results_no_experimental["edges"].push("from" => { "stageIndex" => 0, "stepIndex" => 1 },
                                                             "files" => [{ "displayName" => "file3" }])

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(expected_stage_results_no_experimental)
      end
    end

    describe "GET pipeline viz graph data for another user\'s private sample" do
      it "cannot access viz graph data" do
        private_project = create(:project)
        private_sample = create(:sample, project: private_project,
                                         pipeline_runs_data: [{ pipeline_run_stages_data: pipeline_run_stages_data }])

        get :show, params: { sample_id: private_sample.id }

        expect(response).to have_http_status 404
      end
    end

    describe "GET pipeline viz graph data from sample with no pipeline run (nonadmin)" do
      it "cannot see viz graph data" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project)
        get :show, params: { sample_id: sample.id }

        expect(response).to have_http_status 404
      end
    end

    describe "Get pipeline viz graph data with pipeline viz experimental flag enabled" do
      it "can see all viz graph data, including experimental" do
        @joe.add_allowed_feature("pipeline_viz_experimental")

        project = create(:public_project)
        sample = create(
          :sample, project: project,
                   pipeline_runs_data: [{
                     pipeline_run_stages_data: pipeline_run_stages_data,
                     sfn_execution_arn: FAKE_SFN_EXECUTION_ARN,
                   },]
        )

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(expected_stage_results)
        expect(json_response.keys).to contain_exactly(*expected_stage_results.keys)
      end
    end
  end
end
