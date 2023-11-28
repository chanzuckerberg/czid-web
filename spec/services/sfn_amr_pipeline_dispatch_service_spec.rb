require 'rails_helper'
RSpec.describe SfnAmrPipelineDispatchService, type: :service do
  let(:amr_workflow) { WorkflowRun::WORKFLOW[:amr] }
  let(:pre_mhf_amr_version) { "0.2.4-beta" }
  let(:pre_mhf_short_read_mngs_version) { "7.1.13" }
  let(:modern_amr_version) { "1.3.1" }
  let(:fake_card_versions) do
  {
    "card_version" => "1.1.1",
    "wildcard_version" => "1.1.1",
  }
end

  # for stubbing AWS responses
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn" }
  let(:fake_account_id) { "123456789012" }
  let(:fake_sfn_arn) { "fake:sfn:arn" }
  let(:fake_samples_bucket) { "fake-samples-bucket" }

  let(:fake_states_client) do
    Aws::States::Client.new(
      stub_responses: {
        start_execution: {
          execution_arn: fake_sfn_execution_arn,
          start_date: Time.zone.now,
        },
        list_tags_for_resource: {
          tags: [
            { key: "wdl_version", value: modern_amr_version },
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

  describe "#call" do
    before do
      create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: amr_workflow), value: modern_amr_version)
      create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: fake_sfn_arn)

      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('SAMPLES_BUCKET_NAME').and_return(fake_samples_bucket)

      Aws.config[:stub_responses] = true
      @mock_aws_clients = {
        states: fake_states_client,
        sts: fake_sts_client,
      }

      allow(AwsClient).to receive(:[]) { |client|
        @mock_aws_clients[client]
      }

      @project = create(:project)
      @sample = create(:sample,
                       project: @project,
                       host_genome_name: "Human",
                       metadata_fields: { nucleotide_type: "DNA" },
                       subsample: 1_000_000)
      @workflow_run = create(:workflow_run, sample: @sample, workflow: amr_workflow)

      allow(AmrWorkflowRun).to receive(:latest_card_versions).and_return(fake_card_versions)
    end

    subject { SfnAmrPipelineDispatchService.call(@workflow_run) }

    context "when the project does not use modern host filtering" do
      before do
        ProjectWorkflowVersion.create!({ project_id: @project.id, workflow: amr_workflow, version_prefix: pre_mhf_amr_version })
        WorkflowVersion.create!({ workflow: amr_workflow, version: pre_mhf_amr_version, deprecated: false, runnable: true })
      end

      it "sets the WDL version to the latest version with the pinned prefix" do
        expect(subject).to include_json(
          sfn_input_json: {
            RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_run.workflow_version_tag}/run.wdl.zip",
          }
        )
        expect(@workflow_run.reload.wdl_version).to eq(pre_mhf_amr_version)
      end
    end

    context "when the project uses modern host filtering" do
      it "sets the WDL version to the latest version available" do
        expect(subject).to include_json(
          sfn_input_json: {
            RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_run.workflow_version_tag}/run.wdl.zip",
          }
        )
        expect(@workflow_run.reload.wdl_version).to eq(modern_amr_version)
      end
    end
  end
end
