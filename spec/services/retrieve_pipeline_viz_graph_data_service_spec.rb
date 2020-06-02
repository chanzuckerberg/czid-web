require 'rails_helper'
require 'json'

RSpec.describe RetrievePipelineVizGraphDataService do
  let(:fake_output_prefix) { "s3://fake-output-prefix" }
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: fake_sfn_arn,
      input: JSON.dump(OutputPrefix: fake_output_prefix),
      start_date: Time.zone.now,
      state_machine_arn: fake_sfn_execution_arn,
      status: "FAKE_EXECUTION_STATUS",
    }
  end
  let(:fake_wdl_version) { "999".freeze }
  let(:fake_dag_version) { "9.999".freeze }

  let(:given_targets_dir) { "s3://idseq.../samples/theProjectId/theSampleId/results/1.0" }
  let(:output_dir) { "s3://idseq.../samples/theProjectId/theSampleId/results" }

  let(:pr_stages_data) do
    [{
      name: "Host Filtering",
      dag_json: {
        output_dir_s3: output_dir,
        targets: {
          one: ["unmapped1.fq"],
          two: ["trimmomatic1.fq"],
          # Testing partially concated file path and no url available.
          three: ["file/priceseq1.fa"],
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
            s3_dir: given_targets_dir,
          },
        },
      }.to_json,
    }, {
      name: "Experimental",
      dag_json: {
        output_dir_s3: output_dir,
        targets: {
          three: ["priceseq1.fa"],
          four: ["bowtie2_1.fa"],
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
            s3_dir: given_targets_dir + "/file",
          },
        },
      }.to_json,
    },]
  end

  let(:step_status_data) do
    {
      four: {
        status: "running",
        description: "This is the description of output four.",
      },
    }
  end

  let(:expected_stage_results) do
    {
      stages: [
        {
          steps: [
            {
              name: "Two",
              inputEdges: [0],
              outputEdges: [1],
            },
            {
              name: "Three",
              inputEdges: [1],
              outputEdges: [2],
            },
          ],
        }, {
          steps: [{
            name: "Four",
            inputEdges: [2],
            outputEdges: [3],
          },],
        },
      ],
      edges: [
        {
          # No "from" field as this is the input file.
          to: { stageIndex: 0, stepIndex: 0 },
          files: [{ displayName: "unmapped1.fq", url: "test url" }],
          isIntraStage: false,
        },
        {
          from: { stageIndex: 0, stepIndex: 0 },
          to: { stageIndex: 0, stepIndex: 1 },
          files: [{ displayName: "trimmomatic1.fq", url: "test url" }],
          isIntraStage: true,
        },
        {
          from: { stageIndex: 0, stepIndex: 1 },
          to: { stageIndex: 1, stepIndex: 0 },
          files: [{ displayName: "priceseq1.fa", url: nil }],
          isIntraStage: false,
        },
        {
          from: { stageIndex: 1, stepIndex: 0 },
          files: [{ displayName: "bowtie2_1.fa", url: "test url" }],
          isIntraStage: false,
        },
      ],
      status: "notStarted",
    }
  end

  before do
    Aws.config[:states] = {
      stub_responses: {
        describe_execution: fake_sfn_execution_description,
        list_tags_for_resource: {
          tags: [
            { key: "wdl_version", value: fake_wdl_version },
            { key: "dag_version", value: fake_dag_version },
          ],
        },
      },
    }
  end

  describe "Retrieving graph" do
    before do
      # Project and sample required to create pipeline run.
      project = create(:public_project)
      @sample = create(:sample, project: project)

      @pr = create(:pipeline_run, sample: @sample, pipeline_run_stages_data: pr_stages_data, sfn_execution_arn: fake_sfn_execution_arn)
    end

    it "should be structured correctly" do
      results = RetrievePipelineVizGraphDataService.call(@pr.id, true, false)
      expect(results).to include_json(expected_stage_results)
      expect(results.keys).to contain_exactly(*expected_stage_results.keys)
    end

    it "should include step-level status updates" do
      s3 = Aws::S3::Client.new(stub_responses: true)
      s3.stub_responses(:get_object, body: step_status_data.to_json)

      stub_const("PipelineOutputsHelper::Client", s3)
      # allow(PipelineOutputsHelper).to receive(:get_s3_file).and_return(step_status_data.to_json)
      results = RetrievePipelineVizGraphDataService.call(@pr.id, true, false)

      results[:stages][0][:steps].each do |step|
        # Status should be notStarted if no job status data exists for the step
        expect(step[:status]).to eq("notStarted")
      end

      results[:stages][1][:steps].each_with_index do |step, step_index|
        stage_dag_json = JSON.parse(pr_stages_data[1][:dag_json])
        orig_step_out_name = stage_dag_json["steps"][step_index]["out"]
        expect(step[:status]).to eq("inProgress")
        expect(step[:description]).to eq(step_status_data[orig_step_out_name.to_sym][:description])
      end

      expect(results[:status]).to eq("inProgress")
    end

    context "with see_experimental flag" do
      it "sees all stage results" do
        see_experimental = true
        results = RetrievePipelineVizGraphDataService.call(@pr.id, see_experimental, false)

        # Host filtering and experimental; other stages omitted for brevity.
        expect(results[:stages].length).to be(2)
      end
    end

    context "without see_experimental flag" do
      it "sees all stage results except experimental" do
        see_experimental = false
        results = RetrievePipelineVizGraphDataService.call(@pr.id, see_experimental, false)

        # Only host filtering (other stages omitted for brevity)
        expect(results[:stages].length).to be(1)
      end
    end

    context "for an errored pipeline run with missing dag_json stages" do
      it "only returns information for stages with dag_jsons" do
        stage_without_dag_json = pr_stages_data[1].clone
        stage_without_dag_json[:dag_json] = nil

        pr_stages_data_with_missing_dag_json = pr_stages_data.clone
        pr_stages_data_with_missing_dag_json[1] = stage_without_dag_json

        pr = create(:pipeline_run, sample: @sample, pipeline_run_stages_data: pr_stages_data_with_missing_dag_json, sfn_execution_arn: fake_sfn_execution_arn)
        results = RetrievePipelineVizGraphDataService.call(pr.id, true, false)

        expect(results[:stages].length).to be(1)
      end
    end

    context "without host filtering urls" do
      it "does not include host filtering urls" do
        remove_host_filtering = true
        results = RetrievePipelineVizGraphDataService.call(@pr.id, false, remove_host_filtering)

        # Get files in each edge in Host Filtering stage (except final output) and check for no url
        edges = results[:edges]
        host_filtering = results[:stages][0]
        host_filtering[:steps].each do |step|
          step[:inputEdges].each do |edge_index|
            edge = edges[edge_index]
            if edge[:to][:stageIndex] == 0
              edge[:files].each do |file|
                expect(file[:url]).to be_nil
              end
            end
          end
        end
      end
    end

    context "with host filtering urls" do
      it "includes host filtering urls" do
        remove_host_filtering = false
        results = RetrievePipelineVizGraphDataService.call(@pr.id, false, remove_host_filtering)

        # Get files in each edge in Host Filtering stage (except final output) and check for url
        edges = results[:edges]
        host_filtering = results[:stages][0]
        host_filtering[:steps].each do |step|
          step[:inputEdges].each do |edge_index|
            edge = edges[edge_index]
            if edge[:to][:stageIndex] == 0
              edge[:files].each do |file|
                expect(file[:url]).to be_truthy
              end
            end
          end
        end
      end
    end
  end
end
