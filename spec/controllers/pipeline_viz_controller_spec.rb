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

  let(:fake_sfn_execution_description) do
    {
      execution_arn: "fake_sfn_arn",
      input: JSON.dump(OutputPrefix: "fake_output_prefix"),
      start_date: Time.zone.now,
      state_machine_arn: "fake_sfn_execution_arn",
      status: "FAKE_EXECUTION_STATUS",
    }
  end
  let(:fake_wdl_version) { "999".freeze }
  let(:fake_dag_version) { "9.999".freeze }

  # The step statuses don't make sense from a pipeline view, but this
  # mimics a missing step status file (for Three), which is important to test.
  let(:expected_stage_results) do
    {
      stages: [
        {
          steps: [
            {
              name: "Two",
              description: "This is the description of output two.",
              input_variables: [{ name: "docker_image_id", type: "String" }],
              inputEdges: [3],
              outputEdges: [0],
              status: "finished",
              startTime: nil,
              endTime: nil,
              resources: [],
            },
            {
              name: "Three",
              description: "",
              input_variables: [{ name: "docker_image_id", type: "String" }],
              inputEdges: [0],
              outputEdges: [1],
              status: "notStarted",
              startTime: nil,
              endTime: nil,
              resources: [],
            },
          ],
          jobStatus: "inProgress",
        },
        {
          steps: [
            {
              name: "Four",
              description: "This is the description of output four.",
              input_variables: [{ name: "docker_image_id", type: "String" }],
              inputEdges: [1],
              outputEdges: [2],
              status: "inProgress",
              startTime: nil,
              endTime: nil,
              resources: [],
            },
          ],
          jobStatus: "inProgress",
        },
      ],
      edges: [
        {
          to: { stageIndex: 0, stepIndex: 1 },
          from: { stageIndex: 0, stepIndex: 0 },
          files: [{ displayName: "trimmomatic1.fq", url: "test url" }],
          isIntraStage: true,
        },
        {
          to: { stageIndex: 1, stepIndex: 0 },
          from: { stageIndex: 0, stepIndex: 1 },
          files: [{ displayName: "priceseq1.fa", url: "test url" }],
          isIntraStage: false,
        },
        {
          from: { stageIndex: 1, stepIndex: 0 }, # The last output file, no to
          files: [{ displayName: "bowtie2_1.fa", url: "test url" }],
          isIntraStage: false,
        },
        {
          to: { stageIndex: 0, stepIndex: 0 }, # The first input file, no from
          files: [{ displayName: "unmapped1_fq", url: nil }],
          isIntraStage: false,
        },
      ],
      status: "inProgress",
    }
  end

  let(:results_no_experimental) do
    no_exp = expected_stage_results.deep_dup
    no_exp[:stages].pop
    return no_exp
  end

  let(:results_no_host_filter_urls) do
    no_urls = expected_stage_results.deep_dup
    no_urls[:edges].each do |edge|
      if edge[:from].present? && edge[:from][:stageIndex] == 0
        edge[:files] = edge[:files].map { |f| f[:url] = nil }
      end
    end
    return no_urls
  end

  let(:results_no_exp_or_host_filter) do
    no_exp_or_urls = results_no_host_filter_urls.deep_dup
    no_exp_or_urls[:stages].pop
    return no_exp_or_urls
  end

  let(:expected_json) { JSON.parse(JSON.generate(expected_stage_results)) }

  before do
    allow(SfnPipelineDataService).to receive(:call).with(instance_of(Integer), true, false).and_return(expected_stage_results)
    allow(SfnPipelineDataService).to receive(:call).with(instance_of(Integer), true, true).and_return(results_no_host_filter_urls)
    allow(SfnPipelineDataService).to receive(:call).with(instance_of(Integer), false, false).and_return(results_no_experimental)
    allow(SfnPipelineDataService).to receive(:call).with(instance_of(Integer), false, true).and_return(results_no_exp_or_host_filter)
    allow(Sample).to receive(:get_signed_url).and_return("test url")
  end

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
        expect(json_response).to include_json(expected_json)
        expect(json_response.keys).to contain_exactly(*expected_json.keys)
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
          }]
        )

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response["stages"].length).to eq(1)
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
          }]
        )

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        expect(json_response["stages"].length).to eq(1)
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
                   }]
        )

        get :show, params: { format: "json", sample_id: sample.id }

        json_response = JSON.parse(response.body)
        correct_json = JSON.parse(JSON.generate(results_no_host_filter_urls))
        expect(json_response).to include_json(correct_json)
        expect(json_response.keys).to contain_exactly(*correct_json.keys)
      end
    end
  end
end
