require 'rails_helper'

RSpec.describe AmrWorkflowRun, type: :model do
  subject(:amr_workflow_run) do
    build(
      :amr_workflow_run,
      cached_results: "{"\
        "\"quality_metrics\": {"\
          "\"total_reads\": 24589996,"\
          "\"total_ercc_reads\": 29,"\
          "\"fraction_subsampled\": 0.08770846807107392"\
        "}"\
      "}"
    )
  end

  describe "#zip_link" do
    it "calls zip service and returns result" do
      fake_link = "fake_link"
      expect(WorkflowRunZipService).to receive(:call).with(amr_workflow_run) { fake_link }
      expect(subject.send(:zip_link)).to eq(fake_link)
    end

    context "when consensus genome metrics service fails with exception" do
      it "logs exception and returns nil" do
        expect(WorkflowRunZipService).to receive(:call).with(amr_workflow_run).and_raise(RuntimeError)
        expect(LogUtil).to receive(:log_error).with(
          "Error loading zip link",
          exception: RuntimeError,
          workflow_run_id: amr_workflow_run.id
        )
        expect(subject.send(:zip_link)).to eq(nil)
      end
    end
  end

  describe "#rpm" do
    let(:num_reads) { 300 }
    let(:expected_rpm) { 139.09828748382165.round(2) }

    it "returns the expected value" do
      expect(amr_workflow_run.rpm(num_reads)).to eq(expected_rpm)
    end
  end

  describe "#dpm" do
    let(:read_coverage_depth) { 15.82 }
    let(:expected_dpm) { 7.335116359980196.round(2) }

    it "returns the expected value" do
      expect(amr_workflow_run.dpm(read_coverage_depth)).to eq(expected_dpm)
    end
  end
end
