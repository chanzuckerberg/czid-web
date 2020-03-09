require 'rails_helper'

RSpec.describe PipelineRunStage, type: :model do
  context "#update_job_status" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_execution_strategy) {}
    let(:sfn_execution_arn) {}
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.7", pipeline_execution_strategy: pipeline_execution_strategy, sfn_execution_arn: sfn_execution_arn) }
    let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage, pipeline_run: pipeline_run) }

    subject! { pipeline_run_stage }

    context "when pipeline_execution_strategy is step_function" do
      let(:pipeline_execution_strategy) { 'step_function' }

      context "and a precondition fails" do
        let(:sfn_execution_arn) {}

        it "notifies Airbrake with Invalid precondition" do
          expect(LogUtil).to receive(:log_err_and_airbrake).with(match(/Invalid precondition/))
          subject.update_job_status
        end
      end

      context "and preconditions work" do
        let(:sfn_execution_arn) { "arn:aws:states:us-west-2:123456789012:execution:idseq-dev-main:idseq-1234567890" }

        before { is_expected.to receive(:sfn_info).with(sfn_execution_arn, subject.id, subject.step_number).and_return(["RUNNING", "FAKE_JOB_ID", "FAKE_JOB_DESCRIPTION"]) }
        before { is_expected.to receive(:save) }

        it "updates attributes from #sfn_info method" do
          subject.update_job_status
          is_expected.to have_attributes(job_status: "RUNNING", job_log_id: "FAKE_JOB_ID")
        end
      end
    end
  end
end
