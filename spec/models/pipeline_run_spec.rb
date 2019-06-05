require 'rails_helper'

describe PipelineRun, type: :model do
  describe "#update_job_status" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.7") }
    before { expect(pipeline_run).to receive(:save) }

    subject do
      pipeline_run.update_job_status
    end

    context "when all stages complete successfully" do
      before { allow(pipeline_run).to receive(:active_stage).and_return(nil) }
      it "changes the status to finalized with success" do
        subject
        expect(pipeline_run.finalized).to eq(1)
        expect(pipeline_run.job_status).to eq("CHECKED")
      end
    end

    context "when a stage completes with an error" do
      let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage_1_host_filtering, job_status: PipelineRunStage::STATUS_FAILED, pipeline_run: pipeline_run) }
      before do
        allow(pipeline_run).to receive(:send_sample_failed_error_message)
        allow(pipeline_run).to receive(:active_stage).and_return(pipeline_run_stage)
      end

      context "and when it is a known user error" do
        before { allow(pipeline_run).to receive(:check_for_user_error).and_return(["FAULTY_INPUT", "Some user error"]) }
        it "changes the status to failed" do
          subject
          expect(pipeline_run.finalized).to eq(1)
          expect(pipeline_run.job_status).to eq("1.Host Filtering-FAILED")
        end
        it "saves the user error message" do
          subject
          expect(pipeline_run.known_user_error).to eq("FAULTY_INPUT")
          expect(pipeline_run.error_message).to eq("Some user error")
        end
        it "never sends an error to airbrake" do
          subject
          expect(pipeline_run).not_to have_received(:send_sample_failed_error_message)
        end
      end

      context "and when it is an unexpected error" do
        before do
          allow(pipeline_run).to receive(:active_stage).and_return(pipeline_run_stage)
          allow(pipeline_run).to receive(:check_for_user_error).and_return([nil, nil])
        end
        it "changes the status to failed" do
          subject
          expect(pipeline_run.finalized).to eq(1)
          expect(pipeline_run.job_status).to eq("1.Host Filtering-FAILED")
        end
        it "sends the error to airbrake" do
          subject
          expect(pipeline_run).to have_received(:send_sample_failed_error_message)
        end
      end
    end
  end
end
