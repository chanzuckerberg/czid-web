require "rails_helper"

RSpec.describe HardDeleteNextgenObjects, type: :job do
  create_users
  let(:token) { "abc" }

  def make_cg_query_response(cg_ids)
    HashUtil.to_struct({
                         data: {
                           consensus_genomes: cg_ids.map do |id|
                             { id: id }
                           end,
                         },
                       })
  end

  def make_cg_mutation_response(cg_ids)
    HashUtil.to_struct({
                         data: {
                           delete_consensus_genome: cg_ids.map do |id|
                             { id: id }
                           end,
                         },
                       })
  end

  describe "hard_delete" do
    context "when deleting a consensus genome" do
      let(:object_ids) { ["CG_UUID1", "CG_UUID2", "CG_UUID3"] }

      before do
        create(:nextgen_deletion_log, object_id: "CG_UUID1", object_type: "ConsensusGenome", user_id: @joe.id)
        create(:nextgen_deletion_log, object_id: "CG_UUID2", object_type: "ConsensusGenome", user_id: @joe.id)
      end

      it "raises an error if not all ids correspond to soft-deleted objects" do
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, HardDeleteNextgenObjects::GetSoftDeletedCGs, any_args).and_return(make_cg_query_response(["CG_UUID1", "CG_UUID2"]))
        expect { HardDeleteNextgenObjects.hard_delete(@joe.id, object_ids, "ConsensusGenome", :query_cg_ids, :delete_cgs, token) }.to raise_error(RuntimeError, "Failed to delete: not all object ids were marked as soft deleted")
      end

      it "raises an error if not all objects have a deletion log" do
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, HardDeleteNextgenObjects::GetSoftDeletedCGs, any_args).and_return(make_cg_query_response(["CG_UUID1", "CG_UUID2", "CG_UUID3"]))
        expect { HardDeleteNextgenObjects.hard_delete(@joe.id, object_ids, "ConsensusGenome", :query_cg_ids, :delete_cgs, token) }.to raise_error(RuntimeError, "Failed to delete: not all object ids have deletion logs")
      end

      it "raises an error if not all ids were successfully deleted" do
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, HardDeleteNextgenObjects::GetSoftDeletedCGs, any_args).and_return(make_cg_query_response(["CG_UUID1", "CG_UUID2"]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, HardDeleteNextgenObjects::DeleteCGs, any_args).and_return(make_cg_mutation_response(["CG_UUID1"]))
        expect { HardDeleteNextgenObjects.hard_delete(@joe.id, ["CG_UUID1", "CG_UUID2"], "ConsensusGenome", :query_cg_ids, :delete_cgs, token) }.to raise_error(RuntimeError, "Failed to delete: not all object ids were deleted")
      end

      it "updates the hard_deleted_at field in the deletion log" do
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, HardDeleteNextgenObjects::GetSoftDeletedCGs, any_args).and_return(make_cg_query_response(["CG_UUID1", "CG_UUID2"]))
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, HardDeleteNextgenObjects::DeleteCGs, any_args).and_return(make_cg_mutation_response(["CG_UUID1", "CG_UUID2"]))
        HardDeleteNextgenObjects.hard_delete(@joe.id, ["CG_UUID1", "CG_UUID2"], "ConsensusGenome", :query_cg_ids, :delete_cgs, token)
        expect(NextgenDeletionLog.where(object_id: ["CG_UUID1", "CG_UUID2"], user_id: @joe.id).pluck(:hard_deleted_at)).to all(be_present)
      end
    end
  end
end
