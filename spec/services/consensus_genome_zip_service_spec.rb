require "rails_helper"

RSpec.describe ConsensusGenomeZipService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project, name: "Fake Sample") }
  let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }
  let(:fake_presigned_link) { "fake_presigned_link" }

  subject { ConsensusGenomeZipService.new(workflow_run) }

  describe "#call" do
    it "calls the generate method" do
      expect_any_instance_of(ConsensusGenomeZipService).to receive(:generate).and_return(fake_presigned_link)

      expect(ConsensusGenomeZipService.call(workflow_run)).to eq(fake_presigned_link)
    end
  end

  describe "#generate" do
    it "presigns an S3 link for the target output zip" do
      expect(workflow_run).to receive(:output_path).and_return("fake_output_path")
      expect(subject).to receive(:get_presigned_s3_url).with("fake_output_path", "#{sample.name}_outputs.zip").and_return(fake_presigned_link)

      expect(subject.send(:generate)).to eq(fake_presigned_link)
    end
  end
end
