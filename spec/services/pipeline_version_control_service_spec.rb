require "rails_helper"

RSpec.describe PipelineVersionControlService, type: :service do
  describe "when version_prefix is not specified" do
    let(:version_prefix) { nil }
    let(:short_read_mngs_workflow) { WorkflowRun::WORKFLOW[:short_read_mngs] }
    let(:latest_short_read_mngs_workflow_version) { "1.0.0" }

    before do
      AppConfigHelper.set_workflow_version(short_read_mngs_workflow, latest_short_read_mngs_workflow_version)
      @project = create(:project)
    end

    subject { PipelineVersionControlService.call(@project.id, short_read_mngs_workflow, version_prefix) }

    it "should return the latest version of the workflow" do
      expect(subject).to eq(latest_short_read_mngs_workflow_version)
    end

    it "should not pin the project to a specific workflow version" do
      expect(ProjectWorkflowVersion.exists?(project_id: @project.id, workflow: short_read_mngs_workflow)).to be(false)
    end
  end

  describe "when version_prefix is specified" do
    let(:short_read_mngs_workflow) { WorkflowRun::WORKFLOW[:short_read_mngs] }

    before do
      AppConfigHelper.set_workflow_version(short_read_mngs_workflow, "2.0.0")
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "1.9.9-beta")
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "1.9.8")
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "1.2.2")
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "1.1.1")
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "1.0.5")
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "1.0.4")
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "0.9.9", deprecated: true)
      create(:workflow_version, workflow: short_read_mngs_workflow, version: "0.0.1", deprecated: true, runnable: false)
    end

    context "when the project is not pinned to a specific version for a workflow yet" do
      let(:version_prefix) { "1.9" }
      let(:latest_workflow_version_for_version_prefix) { "1.9.9-beta" }

      before do
        @project = create(:project)
      end

      subject { PipelineVersionControlService.call(@project.id, short_read_mngs_workflow, version_prefix) }

      it "should pin the project to the latest workflow version for the version_prefix and return the latest workflow version" do
        expect(subject).to eq(latest_workflow_version_for_version_prefix)
        expect(ProjectWorkflowVersion.exists?(project_id: @project.id, workflow: short_read_mngs_workflow)).to be(true)
      end
    end

    context "when the project is already pinned to a specific version for one workflow" do
      let(:version_prefix) { "1" }
      let(:latest_workflow_version_for_version_prefix) { "1.9.9-beta" }

      before do
        @project = create(:project)
        create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: version_prefix)
      end

      subject { PipelineVersionControlService.call(@project.id, short_read_mngs_workflow, version_prefix) }

      it "should return the latest version of the workflow for the version_prefix" do
        expect(subject).to eq(latest_workflow_version_for_version_prefix)
      end

      context "when the workflow version pinned is deprecated" do
        let(:version_prefix) { "0.9.9" }
        let(:latest_workflow_version_for_version_prefix) { "0.9.9" }

        before do
          @project = create(:project)
          create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: version_prefix)
        end

        subject { PipelineVersionControlService.call(@project.id, short_read_mngs_workflow, version_prefix) }

        it "should raise an error" do
          expect { subject }.to raise_error(RuntimeError, ErrorHelper::PipelineVersionControlErrors.workflow_version_deprecated(short_read_mngs_workflow, latest_workflow_version_for_version_prefix))
        end
      end

      context "when the workflow version pinned is not runnable" do
        let(:version_prefix) { "0.0.1" }
        let(:latest_workflow_version_for_version_prefix) { "0.0.1" }

        before do
          @project = create(:project)
          create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: version_prefix)
        end

        subject { PipelineVersionControlService.call(@project.id, short_read_mngs_workflow, version_prefix) }

        it "should raise an error" do
          expect { subject }.to raise_error(RuntimeError, ErrorHelper::PipelineVersionControlErrors.workflow_version_not_runnable(short_read_mngs_workflow, latest_workflow_version_for_version_prefix))
        end
      end

      context "when a worklow version for the specified version prefix is not found" do
        let(:version_prefix) { "0.0.0" }

        before do
          @project = create(:project)
          create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: version_prefix)
        end

        subject { PipelineVersionControlService.call(@project.id, short_read_mngs_workflow, version_prefix) }

        it "should raise an error" do
          expect { subject }.to raise_error(RuntimeError, ErrorHelper::PipelineVersionControlErrors.workflow_version_not_found(short_read_mngs_workflow, version_prefix))
        end
      end
    end
  end
end
