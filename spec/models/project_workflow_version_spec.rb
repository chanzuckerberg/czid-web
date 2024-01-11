require 'rails_helper'
describe ProjectWorkflowVersion, type: :model do
  describe "#validates index uniqueness on project and workflow" do
    let(:workflow) { "short-read-mngs" }
    let(:version) { "1" }
    before do
      @project = create(:project)
      create(:project_workflow_version, project_id: @project.id, workflow: workflow, version_prefix: version)
    end

    it "silently fails when create() is used for non-unique index" do
      expect do
        ProjectWorkflowVersion.create(project_id: @project.id, workflow: workflow, version_prefix: "2")
      end.not_to raise_error
      pwvs = ProjectWorkflowVersion.where(project_id: @project.id, workflow: workflow)
      expect(pwvs.count).to eq(1)
      expect(pwvs.last.version_prefix).to eq(version)
    end

    it "allows multiple workflows to be pinned for a project" do
      ProjectWorkflowVersion.create(project_id: @project.id, workflow: "long-read-mngs", version_prefix: "2")
      expect(ProjectWorkflowVersion.where(project_id: @project.id).count).to eq(2)
    end
  end
end
