require "rails_helper"

RSpec.describe HandleSfnNotificationsTimeout, type: :job do
  subject { HandleSfnNotificationsTimeout.perform }

  describe "#perform" do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project) }

    let(:run1) { create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:running], executed_at: 5.hours.ago) }
    let(:run2) { create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:succeeded], executed_at: 25.hours.ago) }
    let(:run3) { create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:running], executed_at: 25.hours.ago) }
    let(:run4) { create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:running], executed_at: 2.days.ago) }

    # job_status for run5 and run7 will be set using run.format_job_status_text in the test
    let(:run5) { create(:pipeline_run, sample: sample, executed_at: 5.hours.ago) }
    let(:run6) { create(:pipeline_run, sample: sample, job_status: PipelineRun::STATUS_CHECKED, executed_at: 25.hours.ago, finalized: 1) }
    let(:run7) { create(:pipeline_run, sample: sample, executed_at: 25.hours.ago) }

    context "when there are no overdue runs" do
      it "does nothing" do
        _ = [run1, run2, run5, run6]
        # Setting the run5's job_status using run.format_job_status_text; in practice, this is how job_status gets set by update_job_status/async_update_job_status.
        run5_job_status = run5.send(:format_job_status_text, run5.active_stage.step_number, run5.active_stage.name, PipelineRun::STATUS_RUNNING, run5.report_ready?)
        run5.update(job_status: run5_job_status)

        expect(subject).to eq(0)
        expect(run1.reload.status).to eq(WorkflowRun::STATUS[:running])
        expect(run2.reload.status).to eq(WorkflowRun::STATUS[:succeeded])
        expect(run5.reload.job_status).to eq(run5_job_status)
        expect(run6.reload.job_status).to eq(PipelineRun::STATUS_CHECKED)
      end
    end

    context "when there are overdue runs" do
      it "marks overdue workflow runs as failed" do
        _ = [run1, run2, run3, run4]

        expect(CloudWatchUtil).to receive(:put_metric_data)

        expect(subject).to eq(2)

        expect(run1.reload.status).to eq(WorkflowRun::STATUS[:running])
        expect(run2.reload.status).to eq(WorkflowRun::STATUS[:succeeded])
        expect(run3.reload.status).to eq(WorkflowRun::STATUS[:failed])
        expect(run4.reload.status).to eq(WorkflowRun::STATUS[:failed])
      end

      it "marks overdue pipeline runs as failed" do
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS, "1")
        _ = [run5, run6, run7]
        # Setting the job_status using run.format_job_status_text; in practice, this is how job_status gets set by update_job_status/async_update_job_status.
        run5_job_status = run5.send(:format_job_status_text, run5.active_stage.step_number, run5.active_stage.name, PipelineRun::STATUS_RUNNING, run5.report_ready?)
        run5.update(job_status: run5_job_status)

        run7_job_status = run5.send(:format_job_status_text, run5.active_stage.step_number, run5.active_stage.name, PipelineRun::STATUS_RUNNING, run5.report_ready?)
        run7.update(job_status: run7_job_status)

        expect(CloudWatchUtil).to receive(:put_metric_data)

        expect(subject).to eq(1)

        expect(run5.reload.job_status).to eq(run5_job_status)
        expect(run6.reload.job_status).to eq(PipelineRun::STATUS_CHECKED)
        expect(run7.reload.job_status).to eq(PipelineRun::STATUS_FAILED)
        expect(run7.reload.results_finalized?).to eq(true)
      end
    end
  end
end
