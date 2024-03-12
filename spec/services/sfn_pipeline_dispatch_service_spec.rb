require 'rails_helper'
require 'json'

require "support/common_stub_constants"

FAKE_SAMPLES_BUCKET = "fake-samples-bucket".freeze
S3_SAMPLES_KEY_PREFIX = "samples/%<project_id>s/%<sample_id>s".freeze
S3_SAMPLES_PATH = "s3://#{FAKE_SAMPLES_BUCKET}/#{S3_SAMPLES_KEY_PREFIX}".freeze
S3_SAMPLE_INPUT_FILES_PATH = "s3://#{FAKE_SAMPLES_BUCKET}/#{S3_SAMPLES_KEY_PREFIX}/fastqs/%<input_file_name>s".freeze
S3_DAG_JSON_KEY = "#{S3_SAMPLES_KEY_PREFIX}/sfn-wdl/%<stage_name>s.dag.json".freeze
S3_WDL_KEY = "#{S3_SAMPLES_KEY_PREFIX}/sfn-wdl/%<stage_name>s.wdl".freeze
S3_WDL_PATH = "s3://#{FAKE_SAMPLES_BUCKET}/#{S3_WDL_KEY}".freeze
SFN_NAME = "idseq-test-%<project_id>s-%<sample_id>s-%<pipeline_run_id>s-%<time>s".freeze
FAKE_DOCKER_IMAGE_ID = "123456789012.dkr.ecr.us-west-2.amazonaws.com/idseq-workflows".freeze
FAKE_REGION = "fake-region".freeze
FAKE_SFN_ARN = "fake:sfn:arn".freeze
TEST_WORKFLOW_NAME = WorkflowRun::WORKFLOW[:short_read_mngs]
PIPELINE_RUN_STAGE_NAMES = PipelineRunStage::STAGE_INFO.values.pluck(:dag_name)
FAKE_WDL_VERSION = "4.9.0".freeze
FAKE_STATES_CLIENT = Aws::States::Client.new(
  stub_responses: {
    start_execution: {
      execution_arn: CommonStubConstants::FAKE_SFN_EXECUTION_ARN,
      start_date: Time.zone.now,
    },
    list_tags_for_resource: {
      tags: [
        { key: "wdl_version", value: FAKE_WDL_VERSION },
      ],
    },
  }
)

RSpec::Matchers.define(:be_one_of) do |expected|
  match do |actual|
    expected.include?(actual)
  end

  failure_message do |actual|
    "expected one of #{expected}, got #{actual}"
  end
end

RSpec.describe SfnPipelineDispatchService, type: :service do
  let(:project) { create(:project) }
  let(:sample) do
    create(:sample,
           project: project,
           host_genome_name: "Human",
           pipeline_execution_strategy: PipelineRun.pipeline_execution_strategies[:step_function],
           metadata_fields: { nucleotide_type: "DNA" })
  end
  let(:pipeline_run) do
    create(:pipeline_run, sample: sample, pipeline_run_stages_data: [
             { name: "Host Filtering", step_number: 1 },
             { name: "Alignment", step_number: 2 },
             { name: "Post Process", step_number: 3 },
             { name: "Experimental", step_number: 4 },
           ])
  end

  describe "#call" do
    subject do
      SfnPipelineDispatchService.call(pipeline_run)
    end

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('SAMPLES_BUCKET_NAME').and_return(FAKE_SAMPLES_BUCKET)
      allow(ENV).to receive(:[]).with('AWS_REGION').and_return(FAKE_REGION)

      create(:app_config, key: AppConfig::SFN_MNGS_ARN, value: FAKE_SFN_ARN)
      create(:workflow_version, workflow: HostGenome::HUMAN_HOST, version: 1)
    end

    context "when SFN has no tag for WDL version" do
      it "returns an exception" do
        expect { subject }.to raise_error(SfnPipelineDispatchService::SfnVersionMissingError, /WDL version for '#{WorkflowRun::WORKFLOW[:short_read_mngs]}' not set/)
      end
    end

    context "with correct settings" do
      let(:idd2wdl_stdout) { "" }
      let(:idd2wdl_stderr) { "" }
      let(:idd2wdl_exitstatus) { 0 }
      let(:aws_cli_stdout) { JSON.dump(execution_arn: CommonStubConstants::FAKE_SFN_EXECUTION_ARN) }
      let(:aws_cli_stderr) { "" }
      let(:aws_cli_exitstatus) { 0 }
      let(:sfn_name) do
        format(SFN_NAME, project_id: project.id, sample_id: sample.id, pipeline_run_id: pipeline_run.id, time: Time.now.to_i)
      end
      let(:sfn_input) { anything }
      let(:sfn_arn) { FAKE_SFN_ARN }
      let(:sfn_execution_arn) { CommonStubConstants::FAKE_SFN_EXECUTION_ARN }
      let(:dag_json_name) { "" }
      let(:PIPELINE_RUN_STAGE_NAMES) { pipeline_run.pipeline_run_stages.pluck(:name).index_with { |_n| {} }.to_h }

      before do
        travel_to DateTime.current

        Aws.config[:stub_responses] = true
        @mock_aws_clients = { states: FAKE_STATES_CLIENT, sts: Aws::STS::Client.new(stub_responses: true) }
        allow(AwsClient).to receive(:[]) { |client|
          @mock_aws_clients[client]
        }

        create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: TEST_WORKFLOW_NAME), value: FAKE_WDL_VERSION)
      end

      it "returns correct json" do
        expect(subject).to include_json({})
      end

      it "returns pipeline version from SFN tag" do
        expect(subject).to include_json(pipeline_version: FAKE_WDL_VERSION.split('.').slice(0, 2).join('.'))
      end

      it "returns sfn input containing fastq input files" do
        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              HostFilter: {
                fastqs_0: format(S3_SAMPLE_INPUT_FILES_PATH, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files.fastq[0].source),
                fastqs_1: format(S3_SAMPLE_INPUT_FILES_PATH, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files.fastq[1].source),
              },
            },
          }
        )
      end

      it "returns sfn input containing output prefix" do
        expect(subject).to include_json(
          sfn_input_json: {
            OutputPrefix: "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample.sample_path}/#{pipeline_run.id}",
          }
        )
      end

      it "returns sfn input containing correct sfn parameters" do
        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              HostFilter: {
                file_ext: "fastq",
                nucleotide_type: "DNA",
                host_genome: "human",
                adapter_fasta: %r{s3://.+},
                star_genome: %r{s3://.+},
                bowtie2_genome: %r{s3://.+},
                human_star_genome: %r{s3://.+},
                human_bowtie2_genome: %r{s3://.+},
                max_input_fragments: nil,
                max_subsample_fragments: nil,
              }, NonHostAlignment: {
                lineage_db: %r{s3://.+},
                accession2taxid_db: %r{s3://.+},
                taxon_blacklist: %r{s3://.+},
                index_dir_suffix: nil,
              }, Postprocess: {
                nt_db: %r{s3://.+},
                nt_loc_db: %r{s3://.+},
                nr_db: %r{s3://.+},
                nr_loc_db: %r{s3://.+},
                lineage_db: %r{s3://.+},
                taxon_blacklist: %r{s3://.+},
              }, Experimental: {
                nt_db: %r{s3://.+},
                nt_loc_db: %r{s3://.+},
                nt_info_db: %r{s3://.+},
                file_ext: "fastq",
              },
            },
          }
        )
      end

      it "uses the project's pinned version of human HostGenome" do
        # This one test needs special set up of additional human versions
        unique_value_for_test = "s3://unique_string_we_tie_only_to_human_v2_for_this_test"
        create(:host_genome, name: "Human", version: 2, s3_bowtie2_index_path: unique_value_for_test)
        create(:workflow_version, workflow: HostGenome::HUMAN_HOST, version: 2)
        create(:host_genome, name: "Human", version: 3) # v3 does NOT use the unique name
        create(:workflow_version, workflow: HostGenome::HUMAN_HOST, version: 3)
        # Pin this project to Human v2, then verify it really used Human v2.
        VersionPinningService.call(project.id, HostGenome::HUMAN_HOST, 2)

        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              HostFilter: {
                bowtie2_genome: unique_value_for_test,
                # ^^^ Because the test sample's host is Human, the unique value appears here.
                human_bowtie2_genome: unique_value_for_test,
                # ^^^ The unique value also shows up here regardless of sample's host.
              },
            },
          }
        )
      end

      context "when start-execution fails" do
        it "raises original exception" do
          @mock_aws_clients[:states].stub_responses(:start_execution, Aws::States::Errors::InvalidArn.new(nil, nil))
          expect { subject }.to raise_error(Aws::States::Errors::InvalidArn)
        end
      end
    end
  end
end
