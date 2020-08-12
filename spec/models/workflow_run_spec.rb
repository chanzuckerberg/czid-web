require "rails_helper"

describe WorkflowRun, type: :model do
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: fake_sfn_execution_arn,
      input: "{}",
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_arn,
      status: "SUCCESS",
    }
  end
  let(:fake_failed_sfn_execution_description) do
    {
      execution_arn: fake_sfn_execution_arn,
      input: "{}",
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_arn,
      status: "FAILED",
    }
  end
  let(:fake_dispatch_response) do
    {
      sfn_input_json: {},
      sfn_execution_arn: fake_sfn_execution_arn,
    }
  end

  before do
    project = create(:project)
    @sample = create(:sample, project: project, temp_pipeline_workflow: WorkflowRun::WORKFLOW[:consensus_genome], temp_wetlab_protocol: Sample::TEMP_WETLAB_PROTOCOL[:artic])
    @workflow_running = create(:workflow_run, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:running], sample: @sample, sfn_execution_arn: fake_sfn_execution_arn)

    @second_sample = create(:sample, project: project)
    @second_workflow_running = create(:workflow_run, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:running], sample: @second_sample, sfn_execution_arn: fake_sfn_execution_arn)

    @workflow_failed = create(:workflow_run, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:failed], sample: @sample, sfn_execution_arn: fake_sfn_execution_arn)

    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
      states: Aws::States::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }

    AppConfigHelper.set_app_config(AppConfig::SFN_CG_ARN, fake_sfn_arn)
  end

  context "#in_progress" do
    it "loads Consensus Genome workflows in progress" do
      res = WorkflowRun.in_progress(WorkflowRun::WORKFLOW[:consensus_genome])
      expect(res).to eq([@workflow_running, @second_workflow_running])
    end

    it "loads all workflow runs in progress" do
      expect(WorkflowRun.in_progress).to eq([@workflow_running, @second_workflow_running])
    end
  end

  context "#update_status" do
    it "checks and updates run statuses" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)

      @workflow_running.update_status
      expect(@workflow_running).to have_attributes(status: fake_sfn_execution_description[:status])
    end

    it "reports run failures" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
      expect(LogUtil).to receive(:log_err_and_airbrake).with(match(/SampleFailedEvent/))

      @workflow_running.update_status
    end
  end

  context "#sfn_description" do
    context "when arn exists" do
      it "returns description" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, lambda { |context|
          context.params[:execution_arn] == fake_sfn_execution_arn ? fake_sfn_execution_description : 'ExecutionDoesNotExist'
        })

        expect(@workflow_running.sfn_description).to have_attributes(fake_sfn_execution_description)
      end
    end

    context "when arn does not exist" do
      it "returns description from s3" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, 'ExecutionDoesNotExist')
        fake_s3_path = File.join(@workflow_running.sample.sample_output_s3_path.split("/", 4)[-1], "sfn-desc", fake_sfn_execution_arn)
        fake_bucket = { fake_s3_path => { body: JSON.dump(fake_sfn_execution_description) } }
        @mock_aws_clients[:s3].stub_responses(:get_object, lambda { |context|
          fake_bucket[context.params[:key]] || 'NoSuchKey'
        })

        # ATTENTION: if loading a JSON from S3 json time fields will come as strings
        expected_description = fake_sfn_execution_description.merge(
          start_date: fake_sfn_execution_description[:start_date].to_s
        )
        expect(@workflow_running.sfn_description).to eq(expected_description)
      end
    end
  end
end
