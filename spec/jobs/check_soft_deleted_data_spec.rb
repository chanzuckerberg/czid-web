require "rails_helper"

RSpec.describe CheckSoftDeletedData, type: :job do
  create_users

  let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }
  let(:admin_user_id) { 123 }

  def stub_nextgen_call
    allow(CheckSoftDeletedData).to receive(:check_for_soft_deleted_data_nextgen)
  end

  it "logs error and raises exception if unexpected error occurs" do
    allow(CheckSoftDeletedData).to receive(:check_for_soft_deleted_data_rails).and_raise(StandardError)
    expect(LogUtil).to receive(:log_error).with("Unexpected error encountered while checking database for soft deleted data", exception: StandardError).exactly(1).times
    expect do
      CheckSoftDeletedData.perform
    end.to raise_error(StandardError)
  end

  context "when there is soft deleted data in the db" do
    before do
      @project = create(:project, users: [@joe])
      @sample1 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 1",
                                 deleted_at: Time.now.utc - CheckSoftDeletedData::DELAY - 1.minute)
      @pr1 = create(:pipeline_run,
                    sample: @sample1,
                    technology: illumina,
                    finalized: 1,
                    deleted_at: Time.now.utc - CheckSoftDeletedData::DELAY - 1.minute)
      @wr1 = create(:workflow_run,
                    sample: @sample1,
                    workflow: consensus_genome,
                    status: WorkflowRun::STATUS[:succeeded],
                    deleted_at: Time.now.utc - CheckSoftDeletedData::DELAY - 1.minute)
    end

    it "logs soft deleted pipeline run and workflow run ids to cloudwatch" do
      expect(LogUtil).to receive(:log_error).with("Soft deleted pipeline runs found in database", exception: CheckSoftDeletedData::SoftDeletedDataError.new, pipeline_run_ids: [@pr1.id]).exactly(1).times
      expect(LogUtil).to receive(:log_error).with("Soft deleted workflow runs found in database", exception: CheckSoftDeletedData::SoftDeletedDataError.new, workflow_run_ids: [@wr1.id]).exactly(1).times
      expect(LogUtil).to receive(:log_error).with("Soft deleted samples found in database", exception: CheckSoftDeletedData::SoftDeletedDataError.new, sample_ids: [@sample1.id]).exactly(1).times
      stub_nextgen_call
      CheckSoftDeletedData.perform
    end
  end

  context "when there is soft deleted data in the db deleted less than DELAY ago" do
    before do
      @project = create(:project, users: [@joe])
      @sample1 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 1")
      @pr1 = create(:pipeline_run,
                    sample: @sample1,
                    technology: illumina,
                    finalized: 1,
                    deleted_at: Time.now.utc - CheckSoftDeletedData::DELAY + 1.minute)
      @wr1 = create(:workflow_run,
                    sample: @sample1,
                    workflow: consensus_genome,
                    status: WorkflowRun::STATUS[:succeeded],
                    deleted_at: Time.now.utc - CheckSoftDeletedData::DELAY + 1.minute)
    end

    it "does not log errors to cloudwatch" do
      stub_nextgen_call
      expect(LogUtil).not_to receive(:log_error)
      CheckSoftDeletedData.perform
    end
  end

  context "when there is no soft deleted data in the db" do
    before do
      @project = create(:project, users: [@joe])
      @sample1 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 1")
      @pr1 = create(:pipeline_run,
                    sample: @sample1,
                    technology: illumina,
                    finalized: 1)
      @wr1 = create(:workflow_run,
                    sample: @sample1,
                    workflow: consensus_genome,
                    status: WorkflowRun::STATUS[:succeeded])
    end

    it "does not log errors to cloudwatch" do
      stub_nextgen_call
      expect(LogUtil).not_to receive(:log_error)
      CheckSoftDeletedData.perform
    end
  end
end
