require "rails_helper"

RSpec.describe WorkflowRunZipService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project, name: "Fake Sample") }
  let(:amr_workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:amr]) }
  let(:cg_workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }
  let(:fake_presigned_link) { "fake_presigned_link" }

  describe "#call" do
    it "calls the generate method" do
      expect_any_instance_of(WorkflowRunZipService).to receive(:generate).and_return(fake_presigned_link)

      expect(WorkflowRunZipService.call(cg_workflow_run)).to eq(fake_presigned_link)
    end
  end

  describe "#generate" do
    it "presigns an S3 link for the AmrWorkflowRun output zip" do
      subject = WorkflowRunZipService.new(amr_workflow_run)
      expect(amr_workflow_run).to receive(:output_path).and_return("fake_output_path")
      expect(subject).to receive(:get_presigned_s3_url).with(s3_path: "fake_output_path", filename: "#{sample.name}_#{amr_workflow_run.id}_outputs.zip").and_return(fake_presigned_link)

      expect(subject.send(:generate)).to eq(fake_presigned_link)
    end

    it "presigns an S3 link for the ConsensusGenomeWorkflowRun output zip" do
      subject = WorkflowRunZipService.new(cg_workflow_run)
      expect(cg_workflow_run).to receive(:output_path).and_return("fake_output_path")
      expect(subject).to receive(:get_presigned_s3_url).with(s3_path: "fake_output_path", filename: "#{sample.name}_#{cg_workflow_run.id}_outputs.zip").and_return(fake_presigned_link)

      expect(subject.send(:generate)).to eq(fake_presigned_link)
    end
  end
end
