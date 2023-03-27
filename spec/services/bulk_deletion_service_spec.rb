require "rails_helper"

RSpec.describe BulkDeletionService, type: :service do
  create_users

  let(:short_read_mngs) { WorkflowRun::WORKFLOW[:short_read_mngs] }
  let(:long_read_mngs) { WorkflowRun::WORKFLOW[:long_read_mngs] }
  let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:amr) { WorkflowRun::WORKFLOW[:amr] }
  let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }
  let(:nanopore) { PipelineRun::TECHNOLOGY_INPUT[:nanopore] }

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
        workflow: short_read_mngs
      )
      expect(validate_samples[:deleted_ids]).to be_empty
    end
  end

  context "when sample ids are passed in for mNGS workflows" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @sample1 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 1",
                                 initial_workflow: short_read_mngs)
      @pr1 = create(:pipeline_run, sample: @sample1, technology: illumina, finalized: 1)
      @sample2 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 2",
                                 initial_workflow: short_read_mngs)
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
        workflow: short_read_mngs
      )
      expect(response[:error]).to be_nil
      expect(response[:deleted_ids]).to contain_exactly(@pr1.id, @pr2.id)
    end

    it "sets the deleted_at field to current time" do
      response = BulkDeletionService.call(
        object_ids: [@sample1.id, @sample2.id],
        user: @joe,
        workflow: short_read_mngs
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

    context "when the initial workflow is short read mNGS" do
      context "when the sample has CG and AMR runs" do
        before do
          create(:workflow_run, sample: @sample1, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
          create(:workflow_run, sample: @sample1, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "sets the initial workflow to CG" do
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_nil
        end
      end

      context "when the sample has an AMR run and no CG runs" do
        before do
          create(:workflow_run, sample: @sample1, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "sets the initial workflow to AMR" do
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(amr)
          expect(@sample1.deleted_at).to be_nil
        end
      end

      context "when the sample has no other runs" do
        it "sets the deleted_at column to the current timestamp" do
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(short_read_mngs)
          expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)
        end
      end
    end

    # This isn't possible right now but if it becomes possible in the future we have a test for it
    context "when the initial workflow is long read mNGS" do
      before do
        @project = create(:project, users: [@joe, @admin])
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Nanopore mNGs sample 1",
                                   initial_workflow: "long-read-mngs")
        @pr1 = create(:pipeline_run, sample: @sample1, technology: nanopore, finalized: 1)
      end

      context "when the sample has CG runs and AMR runs" do
        it "sets the initial workflow to CG" do
          create(:workflow_run, sample: @sample1, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
          create(:workflow_run, sample: @sample1, workflow: amr, status: WorkflowRun::STATUS[:succeeded])

          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: "long-read-mngs"
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_nil
        end
      end

      context "when the sample has AMR runs and no CG runs" do
        it "sets the initial workflow to AMR" do
          create(:workflow_run, sample: @sample1, workflow: amr, status: WorkflowRun::STATUS[:succeeded])

          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: "long-read-mngs"
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(amr)
          expect(@sample1.deleted_at).to be_nil
        end
      end

      context "when the sample has no other runs" do
        it "sets the deleted_at column to the current timestamp" do
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: long_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(long_read_mngs)
          expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)
        end
      end
    end
  end

  context "when workflow run ids are passed in for CG/AMR workflows" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @sample1 = create(:sample, project: @project, user: @joe, name: "Joe sample 1", initial_workflow: consensus_genome)
      @completed_wr = create(:workflow_run, sample: @sample1, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

      @sample2 = create(:sample, project: @project, user: @joe, name: "Joe sample 2", initial_workflow: consensus_genome)
      @failed_wr = create(:workflow_run, sample: @sample2, workflow: consensus_genome, status: WorkflowRun::STATUS[:failed])

      @sample3 = create(:sample, project: @project, user: @joe, name: "Joe sample 3", initial_workflow: amr)
      @completed_amr_wr = create(:workflow_run, sample: @sample3, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
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

    context "when CG runs are deleted and the initial workflow is CG" do
      context "when the sample has more CG runs" do
        it "maintains an initial workflow of CG" do
          create(:workflow_run, sample: @sample1, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

          BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_nil
        end
      end

      context "when the sample has AMR runs" do
        it "sets the initial workflow to AMR" do
          create(:workflow_run, sample: @sample1, workflow: amr, status: WorkflowRun::STATUS[:succeeded])

          BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(amr)
          expect(@sample1.deleted_at).to be_nil
        end
      end

      context "when the sample has no more runs" do
        it "sets the deleted_at column on the sample to the current timestamp" do
          BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)
        end
      end
    end

    context "when AMR runs are deleted and the initial workflow is AMR" do
      context "when the sample has no more runs" do
        it "sets the deleted_at column on the sample to the current timestamp" do
          BulkDeletionService.call(
            object_ids: [@completed_amr_wr.id],
            user: @joe,
            workflow: amr
          )
          @sample3.reload

          expect(@sample3.initial_workflow).to eq(amr)
          expect(@sample3.deleted_at).to be_within(1.minute).of(Time.now.utc)
        end
      end
    end
  end
end
