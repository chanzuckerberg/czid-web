require 'rails_helper'

RSpec.describe ConsensusGenomeCoverageService, type: :service do
  let(:fake_bucket) { {} }
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }
  let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }

  let(:depths) { [0, 0, 10, 234, 300, 250, 124, 50, 20, 0, 30, 50] }
  let(:depths_file_content) { depths.join("\n") }

  let(:max_num_bins) { 4 }

  subject { ConsensusGenomeCoverageService.new(workflow_run, max_num_bins: max_num_bins) }

  describe "#fetch_depths_data" do
    context "when depth file exists" do
      it "fetch and returns correct s3 file" do
        expect(workflow_run).to receive(:output).with(ConsensusGenomeCoverageService::OUTPUT_DEPTHS) { depths_file_content }

        expect(subject.send(:fetch_depths_data)).to eq(depths)
      end
    end

    context "when depth file does not exist" do
      it "returns original exception" do
        expect(workflow_run).to receive(:output).with(ConsensusGenomeCoverageService::OUTPUT_DEPTHS) { nil }

        expect { subject.send(:fetch_depths_data) }.to raise_error(ConsensusGenomeCoverageService::NoDepthDataError, /No depth data available for workflow_run #{workflow_run.id}/)
      end
    end
  end

  describe "#call" do
    before do
      expect(workflow_run).to receive(:output).with(ConsensusGenomeCoverageService::OUTPUT_DEPTHS) { depths_file_content }
    end

    it "computes base statistics correctly" do
      expect(subject.call).to include(
        total_length: 12,
        max_aligned_length: 12
      )
    end

    it "returns correct taxa information" do
      expect(subject.call).to include(
        accession_id: "MN985325.1",
        accession_name: "Severe acute respiratory syndrome coronavirus 2 isolate SARS-CoV-2/human/USA/WA-CDC-WA1/2020, complete genome",
        taxon_id: 2_697_049
      )
    end

    context "when depths size is smaller than number of bins" do
      let(:depths) { [1, 2, 3, 4, 5] }
      let(:max_num_bins) { 3 }

      it "expects bin size to be equal to depths size" do
        expect(subject.call).to include(
          total_length: 5,
          coverage_bin_size: 5.to_f / 3
        )
      end
    end

    context "when depths size is longer than number of bins" do
      let(:depths) { [1, 2, 3, 4, 5] }
      let(:max_num_bins) { 10 }

      it "expects bin size to be equal to be equal to max size" do
        expect(subject.call).to include(
          total_length: 5,
          coverage_bin_size: 1
        )
      end
    end

    context "when total length is a multiple of number of bins" do
      let(:depths) { [2, 2, 0, 0, 4, 6, 0, 0, 1, 0] }
      let(:max_num_bins) { 5 }

      it "computes coverage and breadth correctly (no bins with partial metrics from more than one base pair)" do
        expected_coverage = [
          # idx, average_depth, average_breadth, number of contigs, number of reads
          [0, 2.0, 1.0, 1, 0],
          [1, 0.0, 0.0, 1, 0],
          [2, 5.0, 1.0, 1, 0],
          [3, 0.0, 0.0, 1, 0],
          [4, 0.5, 0.5, 1, 0],
        ]
        # sum / length
        expected_coverage_depth = 1.5
        # (count != 0) / length
        expected_coverage_breadth = 0.5
        expect(subject.call).to include(
          coverage: expected_coverage,
          coverage_bin_size: 2,
          coverage_depth: expected_coverage_depth,
          coverage_breadth: expected_coverage_breadth
        )
      end
    end

    context "when total length is not a multiple of number of bins" do
      let(:depths) { [2, 2, 0, 0, 4, 6, 0, 0, 1, 0, 4, 3] }
      let(:max_num_bins) { 5 }

      it "computes coverage and breadth correctly (bins with partial metrics)" do
        expected_coverage = [
          # idx, average_depth, average_breadth, number of contigs, number of reads
          [0, (4 / 2.4).round(3), (2 / 2.4).round(3), 1, 0],      # [2 * 1, 2 * 1, 0 * 0.4, ...]
          [1, (3.2 / 2.4).round(3), (0.8 / 2.4).round(3), 1, 0],  # [..., 0 * 0.6, 0 * 1, 4 * 0.8, ...]
          [2, (6.8 / 2.4).round(3), (1.2 / 2.4).round(3), 1, 0],  # [..., 4 * 0.2, 6 * 1, 0 * 1, 0 * 0.2, ...]
          [3, (1 / 2.4).round(3), (1 / 2.4).round(3), 1, 0],      # [..., 0 * 0.8, 1 * 1, 0 * 0.6, ...]
          [4, (7 / 2.4).round(3), (2 / 2.4).round(3), 1, 0],      # [..., 0 * 0.4, 4 * 1, 3 * 1]
        ]
        # sum / length
        expected_coverage_depth = 22.0 / 12
        # (count != 0) / length
        expected_coverage_breadth = 7.0 / 12
        expect(subject.call).to include(
          coverage: expected_coverage,
          coverage_bin_size: 12.0 / 5,
          coverage_depth: expected_coverage_depth,
          coverage_breadth: expected_coverage_breadth
        )
      end
    end
  end
end
