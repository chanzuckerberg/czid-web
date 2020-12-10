require 'rails_helper'

RSpec.describe ConsensusGenomeWorkflowRun, type: :model do
  subject(:consensus_genome_workflow_run) { build(:consensus_genome_workflow_run) }

  describe "#coverage_viz" do
    it "calls coverage viz service and returns result" do
      mock_result = { test: true }
      expect(ConsensusGenomeCoverageService).to receive(:call).with(workflow_run: consensus_genome_workflow_run, cacheable_only: false) { mock_result }
      expect(subject.send(:coverage_viz)).to eq(mock_result)
    end

    context "when consensus genome service fails with exception" do
      it "logs exception and returns nil" do
        expect(ConsensusGenomeCoverageService).to receive(:call).with(workflow_run: consensus_genome_workflow_run, cacheable_only: false).and_raise(ConsensusGenomeCoverageService::NoDepthDataError, consensus_genome_workflow_run)
        expect(LogUtil).to receive(:log_error).with(
          "Error loading coverage viz",
          exception: ConsensusGenomeCoverageService::NoDepthDataError,
          workflow_run_id: consensus_genome_workflow_run.id
        )
        expect(subject.send(:coverage_viz)).to eq(nil)
      end
    end
  end

  describe "#results" do
    context "when full results are requested" do
      before do
        @coverage_mock_result = { coverage: true }
        @quality_mock_result = { coverage: true }
        expect(consensus_genome_workflow_run).to receive(:coverage_viz).with(cacheable_only: false) { @coverage_mock_result }
        expect(consensus_genome_workflow_run).to receive(:quality_metrics) { @quality_mock_result }
      end

      it "includes coverage viz result" do
        expect(subject.results).to include(
          coverage_viz: @coverage_mock_result
        )
      end

      it "includes quality metrics result" do
        expect(subject.results).to include(
          quality_metrics: @quality_mock_result
        )
      end

      it "includes taxon info" do
        expect(subject.results).to include(
          taxon_info: {
            accession_id: "MN908947.3",
            accession_name: "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
            taxon_id: 2_697_049,
            taxon_name: "Severe acute respiratory syndrome coronavirus 2",
          }
        )
      end
    end

    context "when cacheable results are requested" do
      before do
        @coverage_mock_result = { coverage_breadth: 0.99 }
        @quality_mock_result = { total_reads: 10 }
        @taxon_mock_result = {
          accession_id: "MN908947.3",
          accession_name: "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
          taxon_id: 2_697_049,
          taxon_name: "Severe acute respiratory syndrome coronavirus 2",
        }
        expect(consensus_genome_workflow_run).to receive(:coverage_viz).with(cacheable_only: true) { @coverage_mock_result }
        expect(consensus_genome_workflow_run).to receive(:quality_metrics) { @quality_mock_result }
      end

      it "returns limited cacheable results" do
        result = subject.results(cacheable_only: true)
        expect(result).to include(
          quality_metrics: @quality_mock_result,
          coverage_viz: @coverage_mock_result,
          taxon_info: @taxon_mock_result
        )
        expect(result).not_to include(coverage_viz: :coverage)
      end
    end
  end

  describe "#quality_metrics" do
    it "calls metrics service and returns result" do
      mock_result = { test: true }
      expect(ConsensusGenomeMetricsService).to receive(:call).with(consensus_genome_workflow_run) { mock_result }
      expect(subject.send(:quality_metrics)).to eq(mock_result)
    end

    context "when consensus genome metrics service fails with exception" do
      it "logs exception and returns nil" do
        expect(ConsensusGenomeMetricsService).to receive(:call).with(consensus_genome_workflow_run).and_raise(RuntimeError)
        expect(LogUtil).to receive(:log_error).with(
          "Error loading quality metrics",
          exception: RuntimeError,
          workflow_run_id: consensus_genome_workflow_run.id
        )
        expect(subject.send(:quality_metrics)).to eq(nil)
      end
    end
  end

  describe "#zip_link" do
    it "calls zip service and returns result" do
      fake_link = "fake_link"
      expect(ConsensusGenomeZipService).to receive(:call).with(consensus_genome_workflow_run) { fake_link }
      expect(subject.send(:zip_link)).to eq(fake_link)
    end

    context "when consensus genome metrics service fails with exception" do
      it "logs exception and returns nil" do
        expect(ConsensusGenomeZipService).to receive(:call).with(consensus_genome_workflow_run).and_raise(RuntimeError)
        expect(LogUtil).to receive(:log_error).with(
          "Error loading zip link",
          exception: RuntimeError,
          workflow_run_id: consensus_genome_workflow_run.id
        )
        expect(subject.send(:zip_link)).to eq(nil)
      end
    end
  end
end
