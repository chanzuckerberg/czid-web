require 'rails_helper'

RSpec.describe AmrWorkflowRun, type: :model do
  subject(:amr_workflow_run) { build(:amr_workflow_run) }

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
end
