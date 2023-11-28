require "rails_helper"

RSpec.describe VersionPinningService, type: :service do
  let(:short_read_mngs_workflow) { WorkflowRun::WORKFLOW[:short_read_mngs] }
  let(:version_to_pin) { "1.0.0" }
  let(:existing_version_prefix) { "0.0.1" }

  describe "#call" do
    before do
      @project = create(:project)
    end

    subject { VersionPinningService.new(@project.id, short_read_mngs_workflow, version_to_pin) }

    context "when there is an existing version prefix for the workflow and project" do
      before do
        create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: existing_version_prefix)
      end

      it "should not update the pinned version" do
        subject.call
        expect(ProjectWorkflowVersion.where(project_id: @project.id, workflow: short_read_mngs_workflow).first.version_prefix).to eq(existing_version_prefix)
      end
    end

    context "when there is no pinned version prefix for the workflow and project" do
      it "should pin the project to the specified prefix" do
        subject.call
        expect(ProjectWorkflowVersion.where(project_id: @project.id, workflow: short_read_mngs_workflow).first.version_prefix).to eq(version_to_pin)
      end
    end
  end
end
