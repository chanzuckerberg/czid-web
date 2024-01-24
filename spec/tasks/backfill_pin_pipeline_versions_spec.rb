require 'rails_helper'

RSpec.describe 'backfill_pin_pipeline_versions' do
  let(:short_read_mngs_workflow) { WorkflowRun::WORKFLOW[:short_read_mngs] }
  let(:cg_workflow) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:amr_workflow) { WorkflowRun::WORKFLOW[:amr] }
  let(:long_read_mngs_workflow) { WorkflowRun::WORKFLOW[:long_read_mngs] }
  let(:pre_mhf_short_read_version) { "7" }

  before do
    user = create(:user)
    @project = create(:project, name: "test project", users: [user])
    @illumina_sample = create(:sample, project: @project, name: "Illumina sample", user: user)
    create(:pipeline_run, sample: @illumina_sample, technology: PipelineRun::TECHNOLOGY_INPUT[:illumina])
    create(:workflow_run, sample: @illumina_sample, workflow: amr_workflow)
    create(:workflow_run, sample: @illumina_sample, workflow: cg_workflow)
    workflow_versions = {
      cg_workflow => "3.4.18",
      short_read_mngs_workflow => "8.2.2",
      amr_workflow => "1.2.5",
      long_read_mngs_workflow => "0.7.3",
    }

    workflow_versions.each do |workflow, version|
      create(:app_config, key: "#{workflow}-version", value: version)
    end

    ProjectWorkflowVersion.create!(project_id: @project.id, workflow: short_read_mngs_workflow, version_prefix: "7")

    Rake.application.invoke_task "backfill_pin_pipeline_versions"
  end

  it "pins workflows regardless of existing runs in the project" do
    expect(ProjectWorkflowVersion.find_by(project_id: @project.id, workflow: amr_workflow).version_prefix).to eq("1")
    expect(ProjectWorkflowVersion.find_by(project_id: @project.id, workflow: cg_workflow).version_prefix).to eq("3")
    expect(ProjectWorkflowVersion.find_by(project_id: @project.id, workflow: long_read_mngs_workflow).version_prefix).to eq("0")
  end

  it "does not overwrite existing pinned workflows" do
    expect(ProjectWorkflowVersion.find_by(project_id: @project.id, workflow: short_read_mngs_workflow).version_prefix).to eq(pre_mhf_short_read_version)
  end
end
