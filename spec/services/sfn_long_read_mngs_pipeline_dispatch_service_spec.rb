require 'rails_helper'

RSpec.describe SfnLongReadMngsPipelineDispatchService, type: :service do
  let(:fake_samples_bucket) { "fake-samples-bucket" }
  let(:fake_account_id) { "123456789012" }
  let(:fake_sfn_arn) { "fake:sfn:arn" }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn" }
  let(:test_workflow_name) { "long-read-mngs" }
  let(:fake_wdl_version) { "0.1.1-beta" }
  let(:fake_alignment_config) { AlignmentConfig::DEFAULT_NAME }

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

  let(:fake_sts_client) do
    Aws::STS::Client.new(
      stub_responses: {
        get_caller_identity: {
          account: fake_account_id,
        },
      }
    )
  end

  let(:project) { create(:project) }

  let(:sample) do
    create(:sample,
           project: project,
           host_genome_name: "Human",
           metadata_fields: { nucleotide_type: "DNA" })
  end
  let(:pipeline_run) do
    create(:pipeline_run, sample: sample)
  end

  describe "#call" do
    subject do
      SfnLongReadMngsPipelineDispatchService.call(pipeline_run)
    end

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('SAMPLES_BUCKET_NAME').and_return(fake_samples_bucket)

      create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: fake_sfn_arn)
      create(:alignment_config, name: fake_alignment_config)

      Aws.config[:stub_responses] = true
      @mock_aws_clients = {
        states: fake_states_client,
        sts: fake_sts_client,
      }

      allow(AwsClient).to receive(:[]) { |client|
        @mock_aws_clients[client]
      }
    end

    # TODO: Uncomment this test after removing hardcoded wdl version
    # context "when workflow has no version" do
    #   it "returns an exception" do
    #     @mock_aws_clients[:states].stub_responses(:list_tags_for_resource, tags: [])
    #     expect { subject }.to raise_error(SfnLongReadMngsPipelineDispatchService::SfnVersionMissingError, /WDL version for '#{test_workflow_name}' not set/)
    #   end
    # end

    context "with WDL version" do
      before do
        create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: test_workflow_name), value: fake_wdl_version)
      end

      context "when start-execution or dispatch fails" do
        it "raises original exception" do
          @mock_aws_clients[:states].stub_responses(:start_execution, Aws::States::Errors::InvalidArn.new(nil, nil))
          expect { subject }.to raise_error(Aws::States::Errors::InvalidArn)
        end
      end
    end
  end
end
