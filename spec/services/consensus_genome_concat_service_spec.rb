require "rails_helper"

RSpec.describe ConsensusGenomeConcatService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }

  let(:workflow_run_1) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }
  let(:workflow_run_2) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }
  let(:workflow_run_3) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }

  let(:fasta_1) do
    ">sample1_A\nATTAAAGGTTTATACCTTCCCAGGTAACAAACCAACCAACTTTCGATCTCTTGTAGATCT\nGTTCTCTAAACGAACTTTAAAATCTGTGTGGCTGTCACTCGGCTGCATGCTTAGTGCACT\n"
  end
  let(:fasta_2) { ">sample1_B\nCACGCAGTATAATTAATAACTAATTACTGTCGTTGACAGGACACGAGTAACTCGTCTATC\nTTCTGCAGGCTGCTTACGGTTTCGTCCGTGTTGCAGCCGATCATCAGCACATCTAGGTTT\n" }
  let(:fasta_3) { ">sample1_C\nCGTCCGGGTGTGACCGAAAGGTAAGATGGAGAGCCTTGTCCCTGGTTTCAACGAGAAAAC\nACACGTCCAACTCAGTTTGCCTGTTTTACAGGTTCGCGACGTGCTCGTACGTGGCTTTGG\n" }

  subject { ConsensusGenomeConcatService.new([workflow_run_1.id, workflow_run_2.id, workflow_run_3.id]) }

  describe "#call" do
    it "calls the generate method" do
      expect_any_instance_of(ConsensusGenomeConcatService).to receive(:generate_concatenated_fasta).and_return(fasta_1 + fasta_2)

      expect(subject.call).to eq(fasta_1 + fasta_2)
    end
  end

  describe "#generate_concatenated_fasta" do
    context "when all consensus output files exist" do
      it "appends the samples together correctly" do
        allow_any_instance_of(WorkflowRun).to receive(:output_path).with(ConsensusGenomeWorkflowRun::OUTPUT_CONSENSUS)
        expect(S3Util).to receive(:get_s3_file).and_return(fasta_1, fasta_2, fasta_3)

        expect(subject.send(:generate_concatenated_fasta)).to eq(fasta_1 + fasta_2 + fasta_3)
      end
    end

    context "when workflow runs are missing" do
      it "raises an error" do
        service = ConsensusGenomeConcatService.new([-1, -2])

        expect { service.send(:generate_concatenated_fasta) }.to raise_error(ConsensusGenomeConcatService::WorkflowRunNotFoundError)
      end
    end

    context "when a workflow run output is missing or empty" do
      it "raises an error" do
        expect_any_instance_of(WorkflowRun).to receive(:output_path).with(ConsensusGenomeWorkflowRun::OUTPUT_CONSENSUS)
        expect(S3Util).to receive(:get_s3_file)

        expect { subject.send(:generate_concatenated_fasta) }.to raise_error(ConsensusGenomeConcatService::EmptyS3FileError)
      end
    end
  end
end
