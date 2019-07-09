require 'rails_helper'

describe PipelineRun, type: :model do
  context "#update_job_status" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.7") }
    before { expect(pipeline_run).to receive(:save!) }

    context "when all stages complete successfully" do
      before { allow(pipeline_run).to receive(:active_stage).and_return(nil) }

      it "changes status to finalized" do
        pipeline_run.update_job_status

        expect(pipeline_run).to have_attributes(finalized: 1, job_status: "CHECKED")
      end
    end

    context "when a stage completes with an error" do
      let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage, job_status: PipelineRunStage::STATUS_FAILED, pipeline_run: pipeline_run) }
      before { allow(pipeline_run).to receive(:active_stage).and_return(pipeline_run_stage) }
      before { allow(pipeline_run).to receive(:report_failed_pipeline_run_stage) }
      before { allow(pipeline_run).to receive(:enqueue_new_pipeline_run) }

      shared_examples "failing sample" do |reports_error:, mutates_model_attributes: {}, enqueues_new_pipeline_run:|
        it "changes status to failed" do
          pipeline_run.update_job_status

          expect(pipeline_run).to have_attributes(finalized: 1,
                                                  job_status: "1.Host Filtering-FAILED",
                                                  **mutates_model_attributes)
        end

        if reports_error
          it "sends error to airbrake" do
            pipeline_run.update_job_status

            expect(pipeline_run).to have_received(:report_failed_pipeline_run_stage).with(instance_of(PipelineRunStage), boolean, anything, true)
          end
        else
          it "does not send error to airbrake" do
            pipeline_run.update_job_status

            expect(pipeline_run).to have_received(:report_failed_pipeline_run_stage).with(instance_of(PipelineRunStage), boolean, anything, false)
          end
        end

        if enqueues_new_pipeline_run
          it "enqueues new pipeline run" do
            pipeline_run.update_job_status

            expect(pipeline_run).to have_received(:enqueue_new_pipeline_run)
          end
        else
          it "does not enqueue new pipeline run" do
            pipeline_run.update_job_status

            expect(pipeline_run).not_to have_received(:enqueue_new_pipeline_run)
          end
        end
      end

      context "and it is a known user error" do
        before { allow(pipeline_run).to receive(:check_for_user_error).and_return(["FAULTY_INPUT", "Some user error"]) }
        before { allow(pipeline_run).to receive(:automatic_restart_allowed?).and_return(true) }

        include_examples "failing sample", reports_error: false,
                                           enqueues_new_pipeline_run: false,
                                           mutates_model_attributes: { known_user_error: "FAULTY_INPUT", error_message: "Some user error" }
      end

      context "and it is not a known user error" do
        before { allow(pipeline_run).to receive(:check_for_user_error).and_return([nil, nil]) }

        context "and an automatic restart is allowed" do
          before { allow(pipeline_run).to receive(:automatic_restart_allowed?).and_return(true) }

          include_examples "failing sample", reports_error: true, enqueues_new_pipeline_run: true
        end

        context "and an automatic restart is not allowed" do
          before { allow(pipeline_run).to receive(:automatic_restart_allowed?).and_return(false) }

          include_examples "failing sample", reports_error: true, enqueues_new_pipeline_run: false
        end
      end
    end
  end

  context "#automatic_restart_allowed?" do
    let(:user) { build_stubbed(:admin) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:list_of_previous_pipeline_runs_same_version) { [] }
    let(:previous_pipeline_runs_same_version_relation) { instance_double("PipelineRun::ActiveRecord_Relation", to_a: list_of_previous_pipeline_runs_same_version) }
    before { allow(pipeline_run).to receive(:previous_pipeline_runs_same_version).and_return(previous_pipeline_runs_same_version_relation) }

    subject { pipeline_run.automatic_restart_allowed? }

    context "when branch is not master" do
      let(:pipeline_run) { build_stubbed(:pipeline_run, pipeline_version: "3.7", sample: sample, pipeline_branch: "anything_other_than_master") }
      it { is_expected.to be_falsy }
    end

    context "when branch is master" do
      let(:pipeline_run) { build_stubbed(:pipeline_run, pipeline_version: "3.7", sample: sample, pipeline_branch: nil) }
      context "and sample has no previous pipeline runs with the same pipeline version" do
        it { is_expected.to be_truthy }
      end

      context "and sample has previous pipeline runs with the same pipeline version" do
        context "and they all succeeded" do
          let(:list_of_previous_pipeline_runs_same_version) { [build_stubbed(:pipeline_run)] }

          it { is_expected.to be_truthy }
        end

        context "and at least one of them failed" do
          let(:list_of_previous_pipeline_runs_same_version) { [build_stubbed(:pipeline_run, job_status: 'FAILED')] }

          it { is_expected.to be_falsy }
        end
      end
    end
  end

  context "#report_failed_pipeline_run_stage" do
    let(:user) { build_stubbed(:admin) }
    let(:sample) { build_stubbed(:sample, user: user, id: 123) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample) }
    let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage, pipeline_run: pipeline_run) }

    before { allow(LogUtil).to receive(:log_err_and_airbrake) }

    it "sends metric to datadog" do
      allow(MetricUtil).to receive(:put_metric_now)

      pipeline_run.send(:report_failed_pipeline_run_stage, pipeline_run_stage, true, "SOME_USER_ERROR", false)

      expect(MetricUtil).to have_received(:put_metric_now).with("samples.failed", 1, ["sample_id:123", "automatic_restart:true", "known_user_error:true", "send_to_airbrake:false"])
    end

    context "when send_to_airbrake is true" do
      it "sends error to airbrake and log error" do
        pipeline_run.send(:report_failed_pipeline_run_stage, pipeline_run_stage, false, nil, true)

        expect(LogUtil).to have_received(:log_err_and_airbrake).with(match(/SampleFailedEvent:/))
      end
    end

    context "when send_to_airbrake is false" do
      before { allow(Rails.logger).to receive(:warn) }
      it "do not send error to airbrake and log warn" do
        pipeline_run.send(:report_failed_pipeline_run_stage, pipeline_run_stage, true, nil, false)

        expect(LogUtil).to_not have_received(:log_err_and_airbrake)
        expect(Rails.logger).to have_received(:warn).with(match(/SampleFailedEvent:/))
      end
    end
  end
end
