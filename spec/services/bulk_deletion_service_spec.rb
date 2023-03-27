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
      @sample3 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 3")
      @pr3 = create(:pipeline_run, sample: @sample3, technology: illumina, finalized: 1)

      @tree = create(:visualization, visualization_type: "tree", user_id: @joe.id, name: "Test Tree", samples: [@sample1])
      @table = create(:visualization, visualization_type: "table", user_id: @joe.id, name: "Test Table", samples: [@sample1])
      @heatmap = create(:visualization, visualization_type: "heatmap", user_id: @joe.id, name: "Test Heatmap", samples: [@sample1, @sample2, @sample3])
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

    it "sets the deleted_at field to current time" do
      response = BulkDeletionService.call(
        object_ids: [@sample1.id, @sample2.id],
        user: @joe,
        workflow: "short-read-mngs"
      )
      expect(response[:error]).to be_nil
      @pr1.reload
      @pr2.reload
      expect(@pr1.deleted_at).to be_within(1.minute).of(Time.now.utc)
      expect(@pr2.deleted_at).to be_within(1.minute).of(Time.now.utc)
    end

    it "deletes associated tables/trees" do
      BulkDeletionService.call(
        object_ids: [@sample1.id, @sample2.id],
        user: @joe,
        workflow: "short-read-mngs"
      )
      expect(Visualization.find_by(id: @tree.id)).to be_nil
      expect(Visualization.find_by(id: @table.id)).to be_nil
    end

    it "deletes associated heatmaps - not enough samples left" do
      BulkDeletionService.call(
        object_ids: [@sample1.id, @sample2.id],
        user: @joe,
        workflow: "short-read-mngs"
      )
      expect(Visualization.find_by(id: @heatmap.id)).to be_nil
    end

    it "updates associated heatmaps - enough samples left" do
      BulkDeletionService.call(
        object_ids: [@sample1.id],
        user: @joe,
        workflow: "short-read-mngs"
      )
      expect(Visualization.find_by(id: @heatmap.id)).to_not be_nil
      expect(Visualization.find_by(id: @heatmap.id).sample_ids).to contain_exactly(@sample2.id, @sample3.id)
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

    it "sets the deleted_at field to current time" do
      response = BulkDeletionService.call(
        object_ids: [@completed_wr.id, @failed_wr.id],
        user: @joe,
        workflow: consensus_genome
      )
      expect(response[:error]).to be_nil
      @completed_wr.reload
      @failed_wr.reload
      expect(@completed_wr.deleted_at).to be_within(1.minute).of(Time.now.utc)
      expect(@failed_wr.deleted_at).to be_within(1.minute).of(Time.now.utc)
    end
  end
end
