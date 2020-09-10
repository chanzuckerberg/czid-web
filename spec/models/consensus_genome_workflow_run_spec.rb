require 'rails_helper'

RSpec.describe ConsensusGenomeWorkflowRun, type: :model do
  subject(:consensus_genome_workflow_run) { build(:consensus_genome_workflow_run) }

  describe "#coverage_viz" do
    it "calls coverage viz service and returns result" do
      mock_result = { test: true }
      expect(ConsensusGenomeCoverageService).to receive(:call).with(consensus_genome_workflow_run) { mock_result }
      expect(subject.send(:coverage_viz)).to eq(mock_result)
    end

    context "when consensus genome service fails with exception" do
      it "logs exception and returns nil" do
        expect(ConsensusGenomeCoverageService).to receive(:call).with(consensus_genome_workflow_run).and_raise(ConsensusGenomeCoverageService::NoDepthDataError, consensus_genome_workflow_run)
        expect(LogUtil).to receive(:log_error).with(
          "Error loading coverage viz",
          exception: ConsensusGenomeCoverageService::NoDepthDataError,
          details: {
            workflow_run_id: consensus_genome_workflow_run.id,
          }
        )
        expect(subject.send(:coverage_viz)).to eq(nil)
      end
    end
  end

  describe "#results" do
    it "includes coverage viz result" do
      mock_result = { test: true }
      expect(consensus_genome_workflow_run).to receive(:coverage_viz) { mock_result }

      expect(subject.results).to include(
        coverage_viz: mock_result
      )
    end
  end
end
