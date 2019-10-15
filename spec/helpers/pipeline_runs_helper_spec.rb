require "rails_helper"
require "webmock/rspec"

RSpec.describe PipelineRunsHelper, type: :helper do
  describe "#get_succeeded_pipeline_run_ids_for_samples" do
    before do
      @joe = create(:joe)
    end
    it "returns succeeded pipeline runs" do
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_FAILED }])
      @sample_three = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING }])

      project_samples = Sample.where(project_id: @project.id)
      pipeline_runs = helper.get_succeeded_pipeline_runs_for_samples(project_samples)

      expect(pipeline_runs.map(&:id)).to eq([@sample_one.first_pipeline_run.id])
    end

    it "returns failed error in strict mode" do
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_FAILED }])

      project_samples = Sample.where(project_id: @project.id)

      expect do
        helper.get_succeeded_pipeline_runs_for_samples(project_samples, true)
      end.to raise_error.with_message(PipelineRunsHelper::PIPELINE_RUN_FAILED_ERROR)
    end

    it "returns still running error in strict mode" do
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING }])

      project_samples = Sample.where(project_id: @project.id)

      expect do
        helper.get_succeeded_pipeline_runs_for_samples(project_samples, true)
      end.to raise_error.with_message(PipelineRunsHelper::PIPELINE_RUN_STILL_RUNNING_ERROR)
    end
  end
end
