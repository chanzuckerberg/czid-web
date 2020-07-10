require 'rails_helper'

RSpec.describe SfnPipelineVizDataService do
  let(:fake_samples_bucket) { "fake-bucket" }
  let(:fake_workflows_bucket) { "fake-workflows-bucket" }
  let(:fake_output_prefix) { "s3://#{fake_samples_bucket}" }
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:project) { create(:public_project) }
  let(:sample) { create(:sample, project: project, status: Sample::STATUS_CHECKED) }
  let(:pr_stages_data) do
    [
      {
        name: PipelineRunStage::HOST_FILTERING_STAGE_NAME,
      },
      {
        name: PipelineRunStage::EXPT_STAGE_NAME,
      },
    ]
  end
  let(:output_dir) { "#{fake_output_prefix}/#{fake_sfn_name}/wdl-#{fake_wdl_version}/dag-#{fake_dag_version}" }
  let(:output_dir_s3) { output_dir }
  let(:given_targets_dir) { "#{fake_output_prefix}/results" }
  let(:host_filtering_wdl) do
    <<~TEXT
      version 1.0

      task Two {
        input {
          String docker_image_id
          File fastq
        }
        command<<<
        echo nothing
        >>>
        output {
          File trimmomatic1_fq = "trimmomatic1.fq"
        }
        runtime {
          docker: docker_image_id
        }
      }

      task Three {
        input {
          String docker_image_id
          File trimmed_fq
        }
        command<<<
        echo nothing
        >>>
        output {
          File priceseq1_fa = "priceseq1.fa"
        }
        runtime {
          docker: docker_image_id
        }
      }

      workflow spec_host_filter_wdl {
        input {
          File unmapped1_fq
          String docker_image_id
        }

        call Two {
          input:
            fastq = unmapped1_fq,
            docker_image_id = docker_image_id
        }

        call Three {
          input:
            trimmed_fq = Two.trimmomatic1_fq,
            docker_image_id = docker_image_id
        }

        output {
          File two_out_trimmomatic_fq = Two.trimmomatic1_fq
          File three_out_priceseq_fa = Three.priceseq1_fa
        }
      }
    TEXT
  end

  let(:experimental_wdl) do
    <<~TEXT
      version 1.0

      task Four {
        input {
          String docker_image_id
          File three_in_priceseq_fa
        }
        command<<<
        echo nothing
        >>>
        output {
          File bowtie2_1_fa = "bowtie2_1.fa"
        }
        runtime {
          docker: docker_image_id
        }
      }

      workflow spec_host_filter_wdl {
        input {
          String docker_image_id
          File three_in_priceseq_fa
        }

        call Four {
          input:
            three_in_priceseq_fa = three_in_priceseq_fa,
            docker_image_id = docker_image_id
        }

        output {
          File four_out_bowtie_fa = Four.bowtie2_1_fa
        }
      }
    TEXT
  end

  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
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

  let(:wdl_bucket) do
    {
      "host_filter.wdl" => {
        body: host_filtering_wdl,
      },
      "experimental.wdl" => {
        body: experimental_wdl,
      },
    }
  end

  let(:step_status_data) do
    {
      two: {
        status: "uploaded",
        description: "This is the description of output two.",
      },
      four: {
        status: "running",
        description: "This is the description of output four.",
      },
    }
  end

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
  let(:pr) { create(:pipeline_run, sample: sample, pipeline_run_stages_data: pr_stages_data, pipeline_version: fake_dag_version, sfn_execution_arn: fake_sfn_execution_arn, wdl_version: fake_wdl_version) }

  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
      states: Aws::States::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }

    @mock_aws_clients[:states] = {
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

    @mock_aws_clients[:s3].stub_responses(
      :list_objects_v2, contents: %w[
        unmapped1.fq
        trimmomatic1.fq
        priceseq1.fa
        dedup1.fa
        lzw1.fa
        bowtie2_1.fa
        subsampled_1.fa
        gsnap_filter_1.fa
      ].map do |filename|
                                    { key: File.join(output_dir_s3.split("/", 4)[-1], filename) }
                                  end
    )

    @mock_aws_clients[:s3].stub_responses(
      :get_object, lambda { |context|
        case context.params[:bucket]
        when fake_samples_bucket
          return { body: step_status_data.to_json }
        when fake_workflows_bucket
          return wdl_bucket[File.basename(context.params[:key])]
        else
          # 'NoSuchKey'
          compare = fake_workflows_bucket == context.params[:bucket]
          return { body: "#{context.params[:bucket]}, #{fake_workflows_bucket}, #{compare}" }
        end
      }
    )

    stub_const("PipelineOutputsHelper::Client", @mock_aws_clients[:s3])
    stub_const("SfnPipelineVizDataService::S3_CLIENT", @mock_aws_clients[:s3])

    stubbed_env = { "SAMPLES_BUCKET_NAME" => fake_samples_bucket }
    stub_const("ENV", ENV.to_hash.merge(stubbed_env))
    stub_const("S3_WORKFLOWS_BUCKET", fake_workflows_bucket)
    stub_const("SAMPLES_BUCKET_NAME", fake_samples_bucket)

    stubbed_dag_names = {
      PipelineRunStage::HOST_FILTERING_STAGE_NAME => {
        "Two" => "two",
        "Three" => "three",
      },
      PipelineRunStage::EXPT_STAGE_NAME => {
        "Four" => "four",
      },
    }
    stub_const("SfnPipelineVizDataService::SFN_STEP_TO_DAG_STEP_NAME", stubbed_dag_names)

    allow(Sample).to receive(:get_signed_url).and_return("test url")
  end

  describe "retrieving graph" do
    context "with admin privileges" do
      subject { SfnPipelineVizDataService.call(pr.id, true, false) }

      it "should be structured correctly" do
        expect(subject).to include_json(expected_stage_results)
        expect(subject.keys).to contain_exactly(*expected_stage_results.keys)
      end

      it "should include step-level status updates" do
        stage_one_steps = subject[:stages][0][:steps]
        expect(stage_one_steps[0][:status]).to eq("finished")
        expect(stage_one_steps[1][:status]).to eq("notStarted")

        in_progress_step = subject[:stages][1][:steps][0]
        expect(in_progress_step[:status]).to eq("inProgress")
        expect(in_progress_step[:description]).to eq(step_status_data[:four][:description])

        expect(subject[:status]).to eq("inProgress")
      end
    end
    context "with see_experimental flag" do
      it "sees all stage results" do
        see_experimental = true
        results = SfnPipelineVizDataService.call(pr.id, see_experimental, false)

        # Host filtering and experimental; other stages omitted for brevity.
        expect(results[:stages].length).to be(2)
      end
    end

    context "without see_experimental flag" do
      it "sees all stage results except experimental" do
        see_experimental = false
        results = SfnPipelineVizDataService.call(pr.id, see_experimental, false)

        # Only host filtering (other stages omitted for brevity)
        expect(results[:stages].length).to be(1)
      end
    end

    context "without host filtering urls" do
      it "does not include host filtering urls" do
        results = SfnPipelineVizDataService.call(pr.id, true, true)

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
        results = SfnPipelineVizDataService.call(pr.id, true, false)

        # Get files in each edge in Host Filtering stage (except final output) and check for url
        edges = results[:edges]
        host_filtering = results[:stages][0]
        host_filtering[:steps].each do |step|
          step[:inputEdges].each do |edge_index|
            edge = edges[edge_index]
            if edge[:to][:stageIndex] == 0 && edge[:to][:stepIndex] != 0
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
