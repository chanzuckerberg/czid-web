require 'rails_helper'
require 'json'

RSpec.describe SfnCGPipelineDispatchService, type: :service do
  let(:fake_samples_bucket) { "fake-samples-bucket" }
  let(:s3_samples_key_prefix) { "samples/%<project_id>s/%<sample_id>s" }
  let(:s3_sample_input_files_path) { "s3://#{fake_samples_bucket}/#{s3_samples_key_prefix}/fastqs/%<input_file_name>s" }
  let(:sfn_name) { "idseq-test-%<project_id>s-%<sample_id>s-cg-%<time>s" }
  let(:fake_sfn_arn) { "fake:sfn:arn" }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn" }
  let(:fake_wdl_version) { "999" }
  let(:fake_states_client) do
    Aws::States::Client.new(
      stub_responses: {
        start_execution: {
          execution_arn: fake_sfn_execution_arn,
          start_date: Time.zone.now,
        },
        list_tags_for_resource: {
          tags: [
            { key: "wdl_version", value: fake_wdl_version },
          ],
        },
      }
    )
  end

  let(:project) { create(:project) }
  let(:sample) do
    create(:sample,
           project: project,
           temp_pipeline_workflow: Sample::CONSENSUS_GENOME_PIPELINE_WORKFLOW)
  end

  describe "#call" do
    subject do
      SfnCGPipelineDispatchService.call(sample)
    end

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('SAMPLES_BUCKET_NAME').and_return(fake_samples_bucket)

      create(:app_config, key: AppConfig::SFN_CG_ARN, value: fake_sfn_arn)

      Aws.config[:stub_responses] = true
      @mock_aws_clients = { states: fake_states_client }
      allow(AwsClient).to receive(:[]) { |client|
        @mock_aws_clients[client]
      }

      Rails.cache.clear
    end

    context "when SFN has no version tags" do
      it "returns an exception" do
        @mock_aws_clients[:states].stub_responses(:list_tags_for_resource, tags: [])
        expect { subject }.to raise_error(SfnCGPipelineDispatchService::SfnVersionTagsMissingError, /Tags missing: \[:wdl_version\]/)
      end
    end

    context "with correct settings" do
      before do
        @mock_aws_clients[:states].stub_responses(:list_tags_for_resource, tags: [
                                                    { key: "wdl_version", value: fake_wdl_version },
                                                  ])
        allow(AwsClient).to receive(:[]) { |client|
          @mock_aws_clients[client]
        }
      end

      it "returns correct json" do
        expect(subject).to include_json({})
      end

      it "returns sfn input containing fastq input files" do
        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              ConsensusGenome: {
                fastqs_0: format(s3_sample_input_files_path, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files[0].source),
                fastqs_1: format(s3_sample_input_files_path, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files[1].source),
              },
            },
          }
        )
      end

      it "returns sfn input containing correct sfn parameters" do
        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              ConsensusGenome: {},
            },
          }
        )
      end

      it "kicks off the CG run and updates the sample as expected" do
        subject
        expect(sample).to have_attributes(temp_sfn_execution_arn: fake_sfn_execution_arn, temp_sfn_execution_status: Sample::SFN_STATUS[:running])
      end

      context "when start-execution or dispatch fails" do
        it "raises original exception" do
          @mock_aws_clients[:states].stub_responses(:start_execution, Aws::States::Errors::InvalidArn.new(nil, nil))
          expect { subject }.to raise_error(Aws::States::Errors::InvalidArn)
          expect(sample).to have_attributes(temp_sfn_execution_arn: nil, temp_sfn_execution_status: Sample::SFN_STATUS[:failed])
        end
      end
    end
  end
end
