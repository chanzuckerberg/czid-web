require 'rails_helper'

describe PipelineRun, type: :model do
  describe "#update_job_status" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.7") }
    before { allow(pipeline_run).to receive(:save) }
    after("saves to database") { expect(pipeline_run).to have_received(:save) }

    context "when all stages complete successfully" do
      before { allow(pipeline_run).to receive(:active_stage).and_return(nil) }
      it "changes status to finalized" do
        pipeline_run.update_job_status
        expect(pipeline_run).to have_attributes(finalized: 1,
                                                job_status: "CHECKED")
      end
    end

    context "when a stage completes with an error" do
      let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage_1_host_filtering, job_status: PipelineRunStage::STATUS_FAILED, pipeline_run: pipeline_run) }
      before { allow(pipeline_run).to receive(:send_sample_failed_error_message) }
      before { allow(pipeline_run).to receive(:active_stage).and_return(pipeline_run_stage) }

      context "and it is a known user error" do
        before { allow(pipeline_run).to receive(:check_for_user_error).and_return(["FAULTY_INPUT", "Some user error"]) }
        it "changes status to failed" do
          pipeline_run.update_job_status
          expect(pipeline_run).to have_attributes(finalized: 1,
                                                  job_status: "1.Host Filtering-FAILED",
                                                  known_user_error: "FAULTY_INPUT",
                                                  error_message: "Some user error")
        end
        it "doesn't send the error to airbrake" do
          pipeline_run.update_job_status
          expect(pipeline_run).not_to have_received(:send_sample_failed_error_message)
        end
      end

      context "and it is an unexpected error" do
        before { allow(pipeline_run).to receive(:check_for_user_error).and_return([nil, nil]) }
        it "changes status to failed" do
          pipeline_run.update_job_status
          expect(pipeline_run).to have_attributes(finalized: 1,
                                                  job_status: "1.Host Filtering-FAILED")
        end
        it "send an error to airbrake" do
          pipeline_run.update_job_status
          expect(pipeline_run).to have_received(:send_sample_failed_error_message)
        end
      end
    end
  end
end
