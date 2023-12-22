require "rails_helper"

RSpec.describe VersionRetrievalService, type: :service do
  let(:short_read_mngs_workflow) { WorkflowRun::WORKFLOW[:short_read_mngs] }
  let(:cg_workflow) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:amr_workflow) { WorkflowRun::WORKFLOW[:amr] }
  let(:long_read_mngs_workflow) { WorkflowRun::WORKFLOW[:long_read_mngs] }
  let(:index_version) { AlignmentConfig::NCBI_INDEX }
  let(:default_index_version) { "01-22-2021" }

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

    create(:workflow_version, workflow: cg_workflow, version: "2.0.9")
    create(:workflow_version, workflow: amr_workflow, version: "1.0.2")
    create(:workflow_version, workflow: long_read_mngs_workflow, version: "0.0.1")
    create(:workflow_version, workflow: index_version, version: "11-22-2023")
    create(:workflow_version, workflow: index_version, version: default_index_version)
  end

  describe "when user_specified_prefix is not present" do
    context "when the project does not have the workflow pinned to a specific version" do
      before do
        AppConfigHelper.set_workflow_version(short_read_mngs_workflow, "1.0.0")
        create(:app_config, key: AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME, value: default_index_version)
        @project = create(:project)
        @default_versions_for_workflow = {
          short_read_mngs_workflow => AppConfigHelper.get_workflow_version(short_read_mngs_workflow),
          index_version => default_index_version,
        }
      end

      it "should return the latest version of the workflow" do
        @default_versions_for_workflow.each do |workflow, default_version|
          expect(VersionRetrievalService.call(@project.id, workflow)).to eq(default_version)
        end
      end
    end

    context "when the project has multiple workflows pinned to specific versions" do
      before do
        @project = create(:project)
        @workflow_version_prefixes = {
          short_read_mngs_workflow => "2.0.0",
          cg_workflow => "2.0",
          amr_workflow => "1",
          long_read_mngs_workflow => "0.0.1",
          index_version => "11-22-2023",
        }

        @workflow_version_prefixes.each do |workflow, version_prefix|
          create(:project_workflow_version, project_id: @project.id, workflow: workflow, version_prefix: version_prefix)
        end
      end

      it "should return the latest version of the workflow for the version_prefix" do
        @workflow_version_prefixes.each do |workflow, version_prefix|
          service = VersionRetrievalService.new(@project.id, workflow)
          latest_version_for_version_prefix = service.send(:fetch_latest_version_for_version_prefix, version_prefix).version

          expect(ProjectWorkflowVersion.find_by(project_id: @project.id, workflow: workflow).present?).to be(true)
          expect(service.call).to eq(latest_version_for_version_prefix)
        end
      end
    end

    context "when the project is already pinned to a specific version for one workflow" do
      let(:version_prefix) { "1" }
      let(:latest_workflow_version_for_version_prefix) { "1.9.9-beta" }

      before do
        @project = create(:project)
        create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: version_prefix)
      end

      subject { VersionRetrievalService.call(@project.id, short_read_mngs_workflow) }

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

        subject { VersionRetrievalService.call(@project.id, short_read_mngs_workflow) }

        it "should raise an error" do
          expect { subject }.to raise_error(RuntimeError, ErrorHelper::VersionControlErrors.workflow_version_deprecated(short_read_mngs_workflow, latest_workflow_version_for_version_prefix))
        end
      end

      context "when the workflow version pinned is not runnable" do
        let(:version_prefix) { "0.0.1" }
        let(:latest_workflow_version_for_version_prefix) { "0.0.1" }

        before do
          @project = create(:project)
          create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: version_prefix)
        end

        subject { VersionRetrievalService.call(@project.id, short_read_mngs_workflow) }

        it "should raise an error" do
          expect { subject }.to raise_error(RuntimeError, ErrorHelper::VersionControlErrors.workflow_version_not_runnable(short_read_mngs_workflow, latest_workflow_version_for_version_prefix))
        end
      end

      context "when a worklow version for the specified version prefix is not found" do
        let(:version_prefix) { "0.0.0" }

        before do
          @project = create(:project)
          create(:project_workflow_version, project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: version_prefix)
        end

        subject { VersionRetrievalService.call(@project.id, short_read_mngs_workflow) }

        it "should raise an error" do
          expect { subject }.to raise_error(RuntimeError, ErrorHelper::VersionControlErrors.workflow_version_not_found(short_read_mngs_workflow, version_prefix))
        end
      end
    end
  end

  describe "when user_specified_prefix is present" do
    before do
      @project = create(:project)
    end

    context "when the project is already pinned to a specific version for a workflow" do
      let(:version_prefix) { "2.0" }

      before do
        create(:project_workflow_version, project_id: @project.id, workflow: cg_workflow, version_prefix: version_prefix)
      end

      subject { VersionRetrievalService.call(@project.id, cg_workflow, "100000") }

      it "should raise an error" do
        expect { subject }.to raise_error(RuntimeError, ErrorHelper::VersionControlErrors.project_workflow_version_already_pinned(@project.id, cg_workflow, version_prefix))
      end
    end

    context "when the project is not already pinned to a specific version for a workflow" do
      let(:latest_workflow_version_for_version_prefix) { "2.0.9" }

      subject { VersionRetrievalService.call(@project.id, cg_workflow, "2.0") }

      it "should return the latest workflow version for the specified prefix" do
        expect(subject).to eq(latest_workflow_version_for_version_prefix)
      end
    end

    context "when the user_specified_prefix has no matching runnable workflows" do
      let(:version_prefix) { "10000" }

      subject { VersionRetrievalService.call(@project.id, cg_workflow, version_prefix) }

      it "should raise an error" do
        expect { subject }.to raise_error(RuntimeError, ErrorHelper::VersionControlErrors.workflow_version_not_found(cg_workflow, version_prefix))
      end
    end
  end
end
