require 'rails_helper'
require 'json'

FAKE_SAMPLES_BUCKET = "fake-samples-bucket".freeze
S3_SAMPLES_KEY_PREFIX = "samples/%<project_id>s/%<sample_id>s".freeze
S3_SAMPLES_PATH = "s3://#{FAKE_SAMPLES_BUCKET}/#{S3_SAMPLES_KEY_PREFIX}/fastqs/%<input_file_name>s".freeze
S3_DAG_JSON_KEY = "#{S3_SAMPLES_KEY_PREFIX}/sfn-wdl/%<stage_name>s.dag.json".freeze
S3_WDL_KEY = "#{S3_SAMPLES_KEY_PREFIX}/sfn-wdl/%<stage_name>s.wdl".freeze
S3_WDL_PATH = "s3://#{FAKE_SAMPLES_BUCKET}/#{S3_WDL_KEY}".freeze
S3_OUTPUT_KEY = "#{S3_SAMPLES_KEY_PREFIX}/sfn-wdl/%<stage_name>s/output.json".freeze
S3_OUTPUT_PATH = "s3://#{FAKE_SAMPLES_BUCKET}/#{S3_OUTPUT_KEY}".freeze
SFN_NAME = "idseq-test-%<project_id>s-%<sample_id>s-%<pipeline_run_id>s-%<time>s".freeze
FAKE_PIPELINE_VERSION = "9999.9".freeze
FAKE_ACCOUNT_ID = "fake-account-id".freeze
FAKE_REGION = "fake-region".freeze
FAKE_SFN_ARN = "fake:sfn:arn".freeze
FAKE_SFN_EXECUTION_ARN = "fake:sfn:execution:arn".freeze
PIPELINE_RUN_STAGE_NAMES = PipelineRunStage::STAGE_INFO.values.pluck(:dag_name)
FAKE_S3 = Aws::S3::Client.new(stub_responses: { put_object: {} })
FAKE_STS = Aws::STS::Client.new(stub_responses: { get_caller_identity: { account: FAKE_ACCOUNT_ID } })

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
  let(:sample) { create(:sample, project: project, pipeline_execution_strategy: PipelineRun.step_function) }
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

      Aws.config[:stub_responses] = true
      allow(Aws::STS::Client).to receive(:new).and_return(FAKE_STS)
      stub_const("S3_CLIENT", FAKE_S3)
      allow(FAKE_S3).to receive(:put_object)
    end

    context "when no pipeline version is defined" do
      it "returns an exception" do
        expect { subject }.to raise_error(SfnPipelineDispatchService::PipelineVersionMissingError)
      end
    end

    context "with correct settings" do
      let(:idd2wdl_stdout) { "" }
      let(:idd2wdl_stderr) { "" }
      let(:idd2wdl_exitstatus) { 0 }
      let(:aws_cli_stdout) { JSON.dump(execution_arn: FAKE_SFN_EXECUTION_ARN) }
      let(:aws_cli_stderr) { "" }
      let(:aws_cli_exitstatus) { 0 }
      let(:sfn_name) do
        format(SFN_NAME, project_id: project.id, sample_id: sample.id, pipeline_run_id: pipeline_run.id, time: Time.now.to_i)
      end
      let(:sfn_input) { anything }
      let(:sfn_arn) { FAKE_SFN_ARN }
      let(:dag_json_name) { "" }
      let(:PIPELINE_RUN_STAGE_NAMES) { pipeline_run.pipeline_run_stages.pluck(:name).map { |n| [n, {}] }.to_h }

      before do
        travel_to DateTime.current

        create(:app_config, key: AppConfig::SFN_PIPELINE_VERSION, value: FAKE_PIPELINE_VERSION)
        create(:app_config, key: AppConfig::SFN_ARN, value: FAKE_SFN_ARN)

        allow(Open3)
          .to receive(:capture3)
          .with(
            {
              "AWS_ACCOUNT_ID" => FAKE_ACCOUNT_ID,
              "AWS_DEFAULT_REGION" => FAKE_REGION,
            },
            "app/jobs/idd2wdl.py", "--name", be_one_of(PIPELINE_RUN_STAGE_NAMES), anything
          )
          .and_return([idd2wdl_stdout, aws_cli_stderr, instance_double(Process::Status, success?: idd2wdl_exitstatus == 0, exitstatus: idd2wdl_exitstatus)])

        allow(Open3)
          .to receive(:capture3)
          .with("aws", "stepfunctions", "start-execution", "--name", sfn_name, "--input", anything, "--state-machine-arn", sfn_arn)
          .and_return([aws_cli_stdout, idd2wdl_stderr, instance_double(Process::Status, success?: aws_cli_exitstatus == 0, exitstatus: aws_cli_exitstatus)])
      end

      it "returns correct a json" do
        expect(subject).to include_json({})
      end

      it "returns pipeline version from app config" do
        expect(subject).to include_json(pipeline_version: FAKE_PIPELINE_VERSION)
      end

      it "returns stage dag jsons for each pipeline stage" do
        expect(subject).to include_json(
          stage_dags_json: PIPELINE_RUN_STAGE_NAMES.map { |n| [n, {}] }.to_h
        )
      end

      it "returns sfn input containing fastq input files" do
        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              HostFilter: {
                fastqs_0: format(S3_SAMPLES_PATH, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files[0].source),
                fastqs_1: format(S3_SAMPLES_PATH, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files[1].source),
              },
            },
          }
        )
      end

      it "returns sfn input containing correct paths to input wdls" do
        expected_input_paths = PIPELINE_RUN_STAGE_NAMES.map do |stage_name|
          ["#{stage_name.upcase}_WDL_URI", format(S3_WDL_PATH, project_id: project.id, sample_id: sample.id, stage_name: stage_name)]
        end.to_h

        expect(subject).to include_json(
          sfn_input_json: expected_input_paths
        )
      end

      it "returns sfn input containing correct paths to outputs" do
        expected_output_pathss = PIPELINE_RUN_STAGE_NAMES.map do |stage_name|
          ["#{stage_name.upcase}_OUTPUT_URI", format(S3_OUTPUT_PATH, project_id: project.id, sample_id: sample.id, stage_name: stage_name)]
        end.to_h

        expect(subject).to include_json(
          sfn_input_json: expected_output_pathss
        )
      end

      it "uploads per-stage dag json files" do
        subject
        expect(FAKE_S3).to have_received(:put_object)
          .with(
            bucket: FAKE_SAMPLES_BUCKET,
            key: be_one_of(PIPELINE_RUN_STAGE_NAMES.map { |n| format(S3_DAG_JSON_KEY, project_id: project.id, sample_id: sample.id, stage_name: n) }),
            body: anything
          )
          .exactly(pipeline_run.pipeline_run_stages.count).times
      end

      it "uploads per-stage wdl files" do
        subject
        expect(FAKE_S3).to have_received(:put_object)
          .with(
            bucket: FAKE_SAMPLES_BUCKET,
            key: be_one_of(PIPELINE_RUN_STAGE_NAMES.map { |n| format(S3_WDL_KEY, project_id: project.id, sample_id: sample.id, stage_name: n) }),
            body: anything
          )
          .exactly(pipeline_run.pipeline_run_stages.count).times
      end

      context "when idd2wdl fails" do
        let(:idd2wdl_exitstatus) { 99 }

        before do
          expect(Open3)
            .to receive(:capture3)
            .with(
              {
                "AWS_ACCOUNT_ID" => FAKE_ACCOUNT_ID,
                "AWS_DEFAULT_REGION" => FAKE_REGION,
              },
              "app/jobs/idd2wdl.py", "--name", be_one_of(PIPELINE_RUN_STAGE_NAMES), anything
            )
            .and_return([idd2wdl_stdout, aws_cli_stderr, instance_double(Process::Status, success?: idd2wdl_exitstatus == 0, exitstatus: idd2wdl_exitstatus)])
            .once
        end

        it "returns an exception" do
          expect { subject }.to raise_error(SfnPipelineDispatchService::Idd2WdlError)
        end
      end
    end
  end
end
