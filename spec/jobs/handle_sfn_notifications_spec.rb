require "rails_helper"

RSpec.describe HandleSfnNotifications, type: :job do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project, name: "Fake Sample") }

  let(:known_wr_execution_arn) { "known-wr-arn" }
  let(:known_pr_execution_arn) { "known-pr-arn" }
  let(:unknown_execution_arn) { "unknown-arn" }
  let(:old_status) { "CREATED" }
  let(:new_status) { "SUCCEEDED" }
  let(:new_pr_status) { "1.Host Filtering-STARTED" }
  let(:workflow_run) { create(:workflow_run, sample: sample, sfn_execution_arn: known_wr_execution_arn) }
  let(:pipeline_run) { create(:pipeline_run, sample: sample, sfn_execution_arn: known_pr_execution_arn) }

  let(:valid_wr_message) do
    {
      "Message" => {
        "detail-type": "Step Functions Execution Status Change",
        "detail": {
          "executionArn": known_wr_execution_arn,
          "status": new_status,
        },
      }.to_json,
    }
  end
  let(:valid_pr_message) do
    {
      "Message" => {
        "detail-type": "Step Functions Execution Status Change",
        "detail": {
          "executionArn": known_pr_execution_arn,
          "status": new_pr_status,
        },
      }.to_json,
    }
  end
  let(:other_event_message) do
    {
      "Message" => {
        "detail-type": "Scheduled Event",
      }.to_json,
    }
  end
  let(:other_execution_message) do
    {
      "Message" => {
        "detail-type": "Step Functions Execution Status Change",
        "detail": {
          "executionArn": unknown_execution_arn,
          "status": new_status,
        },
      }.to_json,
    }
  end
  let(:sqs_msg) { double(message_id: "fake-message-id", body: "fake-body", delete: nil) }

  subject { HandleSfnNotifications.new }

  describe "#perform" do
    it "processes notification messages, updates WorkflowRun status, and deletes the message" do
      _ = workflow_run  # Force it to be loaded
      expect(WorkflowRun).to receive(:find_by).with(sfn_execution_arn: known_wr_execution_arn).and_call_original
      expect(sqs_msg).to receive(:delete)

      subject.perform(sqs_msg, valid_wr_message)

      expect(workflow_run.reload.status).to eq(new_status)
    end

    it "processes notification messages, updates PipelineRun status, and deletes the message" do
      AppConfigHelper.set_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS, "1")
      _ = pipeline_run  # Force it to be loaded
      expect(PipelineRun).to receive(:find_by).with(sfn_execution_arn: known_pr_execution_arn).and_call_original
      expect(sqs_msg).to receive(:delete)

      subject.perform(sqs_msg, valid_pr_message)

      expect(pipeline_run.reload.job_status).to eq(new_pr_status)
    end

    it "ignores other kinds of event messages" do
      expect(WorkflowRun).not_to receive(:find_by)
      expect(sqs_msg).not_to receive(:delete)

      expect(subject.perform(sqs_msg, other_event_message)).to eq(nil)
    end

    it "ignores SFN executions that it does not know about" do
      expect(workflow_run).not_to receive(:update_status)
      expect(sqs_msg).not_to receive(:delete)

      expect(subject.perform(sqs_msg, other_execution_message)).to eq(nil)
    end

    it "reports runtime exceptions" do
      expect(WorkflowRun).to receive(:find_by).and_raise("Something went wrong!")
      expect(sqs_msg).not_to receive(:delete)

      expect(LogUtil).to receive(:log_error)

      subject.perform(sqs_msg, valid_wr_message)
    end
  end
end
