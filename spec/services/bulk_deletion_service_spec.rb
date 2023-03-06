require "rails_helper"

RSpec.describe BulkDeletionService, type: :service do
  create_users

  let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }

  context "when no workflow is passed in" do
    it "raises an error" do
      expect do
        BulkDeletionService.call(
          object_ids: [],
          user: @joe,
          workflow: nil
        )
      end.to raise_error(DeletionValidationService::WorkflowMissingError)
    end
  end

  context "when no object ids are passed in" do
    it "returns an object with empty arrays of ids" do
      validate_samples = BulkDeletionService.call(
        object_ids: [],
        user: @joe,
        workflow: "short-read-mngs"
      )
      expect(validate_samples[:deleted_ids]).to be_empty
    end
  end

  context "when sample ids are passed in for mNGS workflows" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @sample1 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 1")
      @pr1 = create(:pipeline_run, sample: @sample1, technology: illumina, finalized: 1)
      @sample2 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 2")
      @pr2 = create(:pipeline_run, sample: @sample2, technology: illumina, finalized: 1)
    end

    it "returns deletable pipeline run ids for samples" do
      response = BulkDeletionService.call(
        object_ids: [@sample1.id, @sample2.id],
        user: @joe,
        workflow: "short-read-mngs"
      )
      expect(response[:error]).to be_nil
      expect(response[:deleted_ids]).to contain_exactly(@pr1.id, @pr2.id)
    end
  end

  context "when workflow run ids are passed in for CG/AMR workflows" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @sample1 = create(:sample, project: @project, user: @joe, name: "Joe sample 1")
      @completed_wr = create(:workflow_run, sample: @sample1, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

      @sample2 = create(:sample, project: @project, user: @joe, name: "Joe sample 2")
      @failed_wr = create(:workflow_run, sample: @sample2, workflow: consensus_genome, status: WorkflowRun::STATUS[:failed])
    end

    it "returns deletable workflow run ids for workflow runs" do
      response = BulkDeletionService.call(
        object_ids: [@completed_wr.id, @failed_wr.id],
        user: @joe,
        workflow: consensus_genome
      )
      expect(response[:error]).to be_nil
      expect(response[:deleted_ids]).to contain_exactly(@completed_wr.id, @failed_wr.id)
    end
  end
end
