require "rails_helper"

RSpec.describe BulkDeletionServiceNextgen, type: :service do
  create_users

  def stub_soft_delete
    allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::UpdateWorkflowRuns, any_args)
    allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::UpdateSamples, any_args)
    allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::UpdateConsensusGenomes, any_args)
    allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::UpdateBulkDownload, any_args)
    allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::UpdateWorkflowRuns, any_args)
  end

  def make_workflow_runs_response(workflow_runs)
    HashUtil.to_struct({
                         data: {
                           workflow_runs: workflow_runs.map do |wr|
                             {
                               id: wr.id,
                               owner_user_id: wr.owner_user_id,
                               rails_workflow_run_id: wr.rails_workflow_run_id,
                             }
                           end,
                           workflow_run_entity_inputs: workflow_runs.map do |wr|
                             {
                               workflow_run: {
                                 id: wr.id,
                               },
                               input_entity_id: wr.input_entity_id,
                             }
                           end,
                         },
                       })
  end

  def make_workflow_runs_ints_response(workflow_runs)
    HashUtil.to_struct({
                         data: {
                           workflow_runs: workflow_runs.map do |wr|
                             { id: wr.id }
                           end,
                         },
                       })
  end

  def make_workflow_runs_by_sample_id_response(workflow_runs)
    HashUtil.to_struct({
                         data: {
                           workflow_runs: workflow_runs.map do |wr|
                             {
                               id: wr.id,
                               entity_inputs: {
                                 edges: [
                                   node: {
                                     input_entity_id: wr.input_entity_id,
                                   },
                                 ],
                               },
                             }
                           end,
                         },
                       })
  end

  def make_cgs_response(cgs)
    HashUtil.to_struct({
                         data: {
                           consensus_genomes: cgs.map do |cg|
                             {
                               id: cg.id,
                               producing_run_id: cg.producing_run_id,
                               sequencing_read: {
                                 sample: {
                                   id: cg.sample_id,
                                   rails_sample_id: cg.rails_sample_id,
                                 },
                               },
                             }
                           end,
                         },
                       })
  end

  def make_samples_response(samples)
    HashUtil.to_struct({
                         data: {
                           samples: samples.map do |sample|
                             {
                               id: sample.id,
                               rails_sample_id: sample.rails_sample_id,
                               name: sample.name,
                             }
                           end,
                         },
                       })
  end

  def make_bulk_download_workflow_runs_response(bulk_download_wrs)
    HashUtil.to_struct({
                         data: {
                           workflow_runs: bulk_download_wrs.map do |wr|
                             {
                               id: wr.id,
                             }
                           end,
                         },
                       })
  end

  def make_bulk_download_entities_response(bulk_download_entities)
    HashUtil.to_struct({
                         data: {
                           bulk_downloads: bulk_download_entities.map do |entity|
                             {
                               id: entity.id,
                             }
                           end,
                         },
                       })
  end

  let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:token) { "abc" }

  let(:project) { create(:project, users: [@joe]) }
  let(:sample1) { create(:sample, user: @joe, project: project, name: "sample1") }
  let(:sample2) { create(:sample, user: @joe, project: project, name: "sample2") }
  let(:sample3) { create(:sample, user: @joe, project: project, name: "sample3") }
  # WR_UUID1: only CG run on sample UUID1
  # WR_UUID2 failed its run on Sample UUID2
  # WR_UUID3 + 4: both CG runs on sample UUID2. WR_UUID4 is not meant to be deleted
  let(:wr1) { create(:workflow_run, sample_id: sample1.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded]) }
  let(:wr2) { create(:workflow_run, sample_id: sample2.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:failed]) }
  let(:wr3) { create(:workflow_run, sample_id: sample3.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded]) }
  let(:wr4) { create(:workflow_run, sample_id: sample3.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded]) }

  # nextgen stuff
  let(:ng_sample1) do
    HashUtil.to_struct({
                         id: "Sample_UUID1",
                         name: "sample1",
                         rails_sample_id: sample1.id,
                       })
  end
  let(:ng_sample2) do
      HashUtil.to_struct({
                           id: "Sample_UUID2",
                           name: "sample2",
                           rails_sample_id: sample2.id,
                         })
    end
  let(:ng_sample3) do
    HashUtil.to_struct({
                         id: "Sample_UUID3",
                         name: "sample3",
                         rails_sample_id: sample3.id,
                       })
  end

  let(:ng_wr1) do
    HashUtil.to_struct({
                         id: "WR_UUID1",
                         owner_user_id: @joe.id,
                         rails_workflow_run_id: wr1.id,
                         input_entity_id: ng_sample1.id,
                         cg_id: "CG_UUID1",
                       })
  end
  let(:ng_wr2) do
  HashUtil.to_struct({
                       id: "WR_UUID2",
                       owner_user_id: @joe.id,
                       rails_workflow_run_id: wr2.id,
                       input_entity_id: ng_sample2.id,
                     })
end
  let(:ng_wr3) do
  HashUtil.to_struct({
                       id: "WR_UUID3",
                       owner_user_id: @joe.id,
                       rails_workflow_run_id: wr3.id,
                       input_entity_id: ng_sample3.id,
                       cg_id: "CG_UUID2",
                     })
end
  let(:ng_wr4) do
    HashUtil.to_struct(
      {
        id: "WR_UUID4",
        owner_user_id: @joe.id,
        rails_workflow_run_id: wr4.id,
        input_entity_id: ng_sample3.id,
      }
    )
  end
  let(:ng_cg1) do
    HashUtil.to_struct({
                         id: "CG_UUID1",
                         producing_run_id: ng_wr1.id,
                         sample_id: ng_sample1.id,
                         rails_sample_id: ng_sample1.rails_sample_id,
                       })
  end
  let(:ng_cg2) do
    HashUtil.to_struct(
      {
        id: "CG_UUID2",
        producing_run_id: ng_wr3.id,
        sample_id: ng_sample3.id,
        rails_sample_id: ng_sample3.rails_sample_id,
      }
    )
  end

  let(:ng_bulk_download_wr) do
    HashUtil.to_struct({
                         id: "WR_UUID6",
                       })
  end

  let(:ng_bulk_download) do
    HashUtil.to_struct({
                         id: "BD_UUID1",
                       })
  end

  describe "call" do
    context "when there are workflow runs in NextGen" do
      before do
        allow(TokenCreationService).to receive(:call).and_return(token)
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRunsInts, any_args).and_return(make_workflow_runs_ints_response([ng_wr1, ng_wr2, ng_wr3]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRuns, any_args).and_return(make_workflow_runs_response([ng_wr1, ng_wr2, ng_wr3]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetSamples, any_args).and_return(make_samples_response([ng_sample1, ng_sample2, ng_sample3]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRunsBySampleId, any_args).and_return(make_workflow_runs_by_sample_id_response([ng_wr1, ng_wr2, ng_wr3, ng_wr4]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetCGsToDelete, any_args).and_return(make_cgs_response([ng_cg1, ng_cg2]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetBulkDownloadWorkflowRunsForEntities, any_args).and_return(make_bulk_download_workflow_runs_response([ng_bulk_download_wr]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetBulkDownloadsForWorkflowRuns, any_args).and_return(make_bulk_download_entities_response([ng_bulk_download]))
        stub_soft_delete
      end

      context "when the workflow run ids are integers" do
        it "returns the correct ids" do
          response = BulkDeletionServiceNextgen.call(
            user: @joe,
            object_ids: [wr1.id, wr2.id, wr3.id],
            workflow: consensus_genome,
            delete_timestamp: Time.now.utc,
            token: token
          )

          rails_ids = response[:rails_ids]
          expect(rails_ids[:workflow_run_ids]).to contain_exactly(wr1.id, wr2.id, wr3.id)
          expect(rails_ids[:sample_ids]).to contain_exactly(sample1.id, sample2.id, sample3.id)

          nextgen_ids = response[:nextgen_ids]
          expect(nextgen_ids[:cg_ids]).to contain_exactly(ng_cg1.id, ng_cg2.id)
          expect(nextgen_ids[:workflow_run_ids]).to contain_exactly(ng_wr1.id, ng_wr2.id, ng_wr3.id)
          expect(nextgen_ids[:bulk_download_workflow_run_ids]).to contain_exactly(ng_bulk_download_wr.id)
          expect(nextgen_ids[:bulk_download_entity_ids]).to contain_exactly(ng_bulk_download.id)

          # Only the sample ids without remaining workflow runs are returned
          expect(nextgen_ids[:sample_ids]).to contain_exactly(ng_sample1.id, ng_sample2.id)
        end

        it "creates a deletion log for each object" do
          BulkDeletionServiceNextgen.call(
            user: @joe,
            object_ids: [wr1.id, wr2.id, wr3.id],
            workflow: consensus_genome,
            delete_timestamp: Time.now.utc,
            token: token
          )
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: "ConsensusGenome").pluck(:object_id)).to contain_exactly(ng_cg1.id, ng_cg2.id)
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: WorkflowRun.name).pluck(:object_id)).to contain_exactly(ng_wr1.id, ng_wr2.id, ng_wr3.id, ng_bulk_download_wr.id)
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: Sample.name).pluck(:object_id)).to contain_exactly(ng_sample1.id, ng_sample2.id)
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: BulkDownload.name).pluck(:object_id)).to contain_exactly(ng_bulk_download.id)
        end
      end

      context "when the workflow run ids are UUIDs" do
        it "returns the correct ids" do
          response = BulkDeletionServiceNextgen.call(
            user: @joe,
            object_ids: [ng_wr1.id, ng_wr2.id, ng_wr3.id],
            workflow: consensus_genome,
            delete_timestamp: Time.now.utc,
            token: token
          )

          rails_ids = response[:rails_ids]
          expect(rails_ids[:workflow_run_ids]).to contain_exactly(wr1.id, wr2.id, wr3.id)
          expect(rails_ids[:sample_ids]).to contain_exactly(sample1.id, sample2.id, sample3.id)

          nextgen_ids = response[:nextgen_ids]
          expect(nextgen_ids[:cg_ids]).to contain_exactly(ng_cg1.id, ng_cg2.id)
          expect(nextgen_ids[:workflow_run_ids]).to contain_exactly(ng_wr1.id, ng_wr2.id, ng_wr3.id)
          expect(nextgen_ids[:bulk_download_workflow_run_ids]).to contain_exactly(ng_bulk_download_wr.id)
          expect(nextgen_ids[:bulk_download_entity_ids]).to contain_exactly(ng_bulk_download.id)

          # Only the sample ids without remaining workflow runs are returned
          expect(nextgen_ids[:sample_ids]).to contain_exactly(ng_sample1.id, ng_sample2.id)
        end

        it "creates a deletion log for each object" do
          BulkDeletionServiceNextgen.call(
            user: @joe,
            object_ids: [ng_wr1.id, ng_wr2.id, ng_wr3.id],
            workflow: consensus_genome,
            delete_timestamp: Time.now.utc,
            token: token
          )
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: "ConsensusGenome").pluck(:object_id)).to contain_exactly(ng_cg1.id, ng_cg2.id)
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: WorkflowRun.name).pluck(:object_id)).to contain_exactly(ng_wr1.id, ng_wr2.id, ng_wr3.id, ng_bulk_download_wr.id)
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: Sample.name).pluck(:object_id)).to contain_exactly(ng_sample1.id, ng_sample2.id)
          expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: BulkDownload.name).pluck(:object_id)).to contain_exactly(ng_bulk_download.id)
        end
      end
    end

    context "when there are no workflow runs in NextGen" do
      before do
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRunsInts, any_args).and_return(make_workflow_runs_ints_response([]))
      end

      it "should return the rails ids corresponding to samples and workflows" do
        rails_ids, nextgen_ids = BulkDeletionServiceNextgen.call(
          user: @joe,
          object_ids: [wr1.id, wr2.id, wr3.id],
          workflow: consensus_genome,
          delete_timestamp: Time.now.utc,
          token: token
        ).values_at(:rails_ids, :nextgen_ids)
        expect(rails_ids[:workflow_run_ids]).to contain_exactly(wr1.id, wr2.id, wr3.id)
        expect(rails_ids[:sample_ids]).to contain_exactly(sample1.id, sample2.id, sample3.id)
        expect(nextgen_ids).to be_empty
      end

      it "does not create any deletion logs" do
        BulkDeletionServiceNextgen.call(
          user: @joe,
          object_ids: [wr1.id, wr2.id, wr3.id],
          workflow: consensus_genome,
          delete_timestamp: Time.now.utc,
          token: token
        )
        expect(NextgenDeletionLog.where(user_id: @joe.id).count).to eq(0)
      end
    end

    context "when only some of the workflow runs are in NextGen" do
      before do
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRunsInts, any_args).and_return(make_workflow_runs_ints_response([ng_wr1]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRuns, any_args).and_return(make_workflow_runs_response([ng_wr1]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetSamples, any_args).and_return(make_samples_response([ng_sample1]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRunsBySampleId, any_args).and_return(make_workflow_runs_by_sample_id_response([ng_wr1]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetCGsToDelete, any_args).and_return(make_cgs_response([ng_cg1]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetBulkDownloadWorkflowRunsForEntities, any_args).and_return(make_bulk_download_workflow_runs_response([]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetBulkDownloadsForWorkflowRuns, any_args).and_return(make_bulk_download_entities_response([]))
        stub_soft_delete
      end

      it "should return all the rails workflow run and sample ids" do
        rails_ids = BulkDeletionServiceNextgen.call(
          user: @joe,
          object_ids: [wr1.id, wr2.id, wr3.id],
          workflow: consensus_genome,
          delete_timestamp: Time.now.utc,
          token: token
        )[:rails_ids]
        expect(rails_ids[:workflow_run_ids]).to contain_exactly(wr1.id, wr2.id, wr3.id)
        expect(rails_ids[:sample_ids]).to contain_exactly(sample1.id, sample2.id, sample3.id)
      end

      it "should return the correct nextgen ids" do
        nextgen_ids = BulkDeletionServiceNextgen.call(
          user: @joe,
          object_ids: [wr1.id, wr2.id, wr3.id],
          workflow: consensus_genome,
          delete_timestamp: Time.now.utc,
          token: token
        )[:nextgen_ids]
        expect(nextgen_ids[:workflow_run_ids]).to contain_exactly(ng_wr1.id)
        expect(nextgen_ids[:sample_ids]).to contain_exactly(ng_sample1.id)
        expect(nextgen_ids[:cg_ids]).to contain_exactly(ng_cg1.id)
        expect(nextgen_ids[:bulk_download_workflow_run_ids]).to be_empty
        expect(nextgen_ids[:bulk_download_entity_ids]).to be_empty
      end

      it "creates a deletion log for each nextgen object" do
        BulkDeletionServiceNextgen.call(
          user: @joe,
          object_ids: [wr1.id, wr2.id, wr3.id],
          workflow: consensus_genome,
          delete_timestamp: Time.now.utc,
          token: token
        )
        expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: "ConsensusGenome").pluck(:object_id)).to contain_exactly(ng_cg1.id)
        expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: WorkflowRun.name).pluck(:object_id)).to contain_exactly(ng_wr1.id)
        expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: Sample.name).pluck(:object_id)).to contain_exactly(ng_sample1.id)
        expect(NextgenDeletionLog.where(user_id: @joe.id, object_type: BulkDownload.name).count).to eq(0)
      end
    end
  end

  describe "find_samples_to_delete" do
    # TODO: test correctly identifying samples to delete
  end
end
