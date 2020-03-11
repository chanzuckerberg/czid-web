require 'rails_helper'

RSpec.describe UpdatePipelineRunStageService do
  let(:pipeline_run_id) { 12_345 }
  let(:stage_number) { 1 }
  let(:status) { "STARTED" }

  subject(:described_service_call) { described_class.call(pipeline_run_id, stage_number, status) }

  context "when PipelineRun doesn't exist" do
    it "raises ActiveRecord::RecordNotFound error" do
      expect { described_service_call }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  context "when PipelineRun exists" do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project_id: project.id) }
    let(:pipeline_run) { @pipeline_run }
    let(:pipeline_execution_strategy) { 'step_function' }

    before do
      @pipeline_run = create(:pipeline_run, id: pipeline_run_id, sample_id: sample.id, pipeline_execution_strategy: pipeline_execution_strategy)
    end

    subject(:pipeline_run_stages_statuses) { @pipeline_run.pipeline_run_stages.order(:step_number).pluck(:job_status) }

    shared_examples "check status changes" do |input_stage_number, expected_pipeline_run_stages_statuses, expected_pipeline_run_job_status|
      let(:stage_number) { input_stage_number }
      it "changes status for pipeline_run and pipeline_run_stages" do
        described_service_call
        expect(pipeline_run_stages_statuses).to eq(expected_pipeline_run_stages_statuses)
        expect(pipeline_run).to have_attributes(job_status: expected_pipeline_run_job_status)
      end
    end

    context "and has not started" do
      context "and receives stage update in the correct order" do
        include_examples("check status changes", 1, ["STARTED", nil, nil, nil], "1.Host Filtering-STARTED")
      end
      context "and receives stage update out of order" do
        include_examples("check status changes", 3, ["COMPLETED", nil, nil, nil], "1.Host Filtering-STARTED")
      end
    end
    context "and has alreay started" do
      context "and receives pipeline_run_stage update in order" do
      end
      context "and receives an update out of order" do
      end
    end
  end

  # context "#initialize" do
  #   let(:user) { build_stubbed(:user) }
  #   let(:sample) { build_stubbed(:sample, user: user) }
  #   let(:pipeline_execution_strategy) {}
  #   let(:sfn_execution_arn) {}
  #   let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.7", pipeline_execution_strategy: pipeline_execution_strategy, sfn_execution_arn: sfn_execution_arn) }
  #   let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage, pipeline_run: pipeline_run) }

  #   subject! { pipeline_run_stage }

  #   context "when pipeline_execution_strategy is step_function" do
  #     let(:pipeline_execution_strategy) { 'step_function' }

  #     context "and a precondition fails" do
  #       let(:sfn_execution_arn) {}

  #       it "notifies Airbrake with Invalid precondition" do
  #         expect(LogUtil).to receive(:log_err_and_airbrake).with(match(/Invalid precondition/))
  #         subject.update_job_status
  #       end
  #     end

  #     context "and preconditions work" do
  #       let(:sfn_execution_arn) { "arn:aws:states:us-west-2:123456789012:execution:idseq-dev-main:idseq-1234567890" }

  #       before { is_expected.to receive(:sfn_info).with(sfn_execution_arn, subject.id, subject.step_number).and_return(["RUNNING", "FAKE_JOB_ID", "FAKE_JOB_DESCRIPTION"]) }
  #       before { is_expected.to receive(:save) }

  #       it "updates attributes from #sfn_info method" do
  #         subject.update_job_status
  #         is_expected.to have_attributes(job_status: "RUNNING", job_log_id: "FAKE_JOB_ID", job_description: "FAKE_JOB_DESCRIPTION")
  #       end
  #     end
  #   end
  # end
end
