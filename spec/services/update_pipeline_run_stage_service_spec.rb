# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UpdatePipelineRunStageService do
  let(:pipeline_run_id) { 12_345 }
  let(:stage_number) { 1 }
  let(:job_status) { "SUCCEEDED" }

  let(:described_service_instance) { described_class.new(pipeline_run_id, stage_number, job_status) }

  context "when PipelineRun doesn't exist" do
    it "raises ActiveRecord::RecordNotFound error" do
      expect { described_service_instance.call }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  context "when PipelineRun exists" do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project_id: project.id) }
    let(:pipeline_execution_strategy) { 'step_function' }

    before do
      create(:pipeline_run, id: pipeline_run_id, sample_id: sample.id, pipeline_execution_strategy: pipeline_execution_strategy)
    end

    context "#pipeline_run" do
      it "returns the pipeline_run" do
        pipeline_run = described_service_instance.pipeline_run
        expect(pipeline_run).to have_attributes(id: pipeline_run_id, sample_id: sample.id)
      end
    end

    context "#call" do
      let(:pipeline_run) { described_service_instance.pipeline_run }

      it "updates pipeline_run_stage job_status" do
        described_service_instance.call
        prs = pipeline_run.reload.pipeline_run_stages.find_by(step_number: stage_number)
        expect(prs).to have_attributes(job_status: job_status)
      end

      context "when step 1 succeeded" do
        it "updates pipeline_run job_status" do
          described_service_instance.call
          expect(pipeline_run.reload).to have_attributes(job_status: "2.Minimap2/Diamond alignment-STARTED")
        end
      end
      context "when step 1 failed" do
        before { expect(described_service_instance.pipeline_run).to receive(:report_failed_pipeline_run_stage) }
        let(:job_status) { "FAILED" }
        it "updates pipeline_run job_status" do
          described_service_instance.call
          expect(pipeline_run.reload).to have_attributes(job_status: "1.Host Filtering-FAILED")
        end
      end
    end
  end
end
