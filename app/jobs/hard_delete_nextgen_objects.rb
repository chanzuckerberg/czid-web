require 'resque-retry'

# Deletes NextGen objects. Separation of hard deletion into different
# NextGen and Rails jobs is contingent on all logic of "what should I delete?"
# being handled in the synchronous bulk deletion services.
# This job also doesn't handle retrying due to deadlocks and S3 rate limiting
# -- that should be handled in NextGen.
class HardDeleteNextgenObjects
  extend InstrumentedJob
  extend Resque::Plugins::Retry # automatically retries job once on failure (e.g. deploy cancels job)

  @queue = :hard_delete_nextgen_objects
  @retry_delay = 120

  # ------------------------------------------
  # Queries
  # ------------------------------------------
  DeleteCGs = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation ($ids: [UUID!]) {
      deleteConsensusGenome (where: {
        id: { _in: $ids }
      }) {
        id
      }
    }
  GRAPHQL

  DeleteSamples = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation ($ids: [UUID!]) {
      deleteSample (where: {
        id: { _in: $ids }
      }) {
        id
      }
    }
  GRAPHQL

  DeleteWorkflowRuns = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation ($ids: [UUID!]) {
      deleteWorkflowRun (where: {
        id: { _in: $ids }
      }) {
        id
      }
    }
  GRAPHQL

  DeleteBulkDownloads = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($ids: [UUID!]) {
      deleteBulkDownload(where: {
        id: { _in: $ids }
      }) {
        id
      }
    }
  GRAPHQL

  GetSoftDeletedCGs = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($ids: [UUID!]) {
      consensusGenomes (where: {
        id: { _in: $ids }
        deletedAt: { _is_null: false }
      }) {
        id
      }
    }
  GRAPHQL

  GetSoftDeletedSamples = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($ids: [UUID!]) {
      samples (where: {
        id: { _in: $ids }
        deletedAt: { _is_null: false }
      }) {
        id
      }
    }
  GRAPHQL

  GetSoftDeletedWorkflowRuns = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($ids: [UUID!]) {
      workflowRuns (where: {
        id: { _in: $ids }
        deletedAt: { _is_null: false }
      }) {
        id
      }
    }
  GRAPHQL

  GetSoftDeletedBulkDownloads = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($ids: [UUID!]) {
      bulkDownloads (where: {
        id: { _in: $ids }
        deletedAt: { _is_null: false }
      }) {
        id
      }
    }
  GRAPHQL

  # ------------------------------------------
  # Job
  # ------------------------------------------
  # TODO: ideally this should accept a generic list of ids and their object types,
  # and then we map the type to the appropriate mutation.
  def self.perform(user_id, cg_ids, sample_ids, workflow_run_ids, deprecated_workflow_run_ids, bulk_download_workflow_run_ids, bulk_download_entity_ids)
    Rails.logger.info("Starting to hard delete NextGen objects")
    # service identity field required for deletions
    deletion_token = TokenCreationService.call(user_id: user_id, should_include_project_claims: true, service_identity: "rails")["token"]
    hard_delete(user_id, cg_ids, "ConsensusGenome", :query_cg_ids, :delete_cgs, deletion_token) if cg_ids.present?
    hard_delete(user_id, sample_ids, "Sample", :query_sample_ids, :delete_samples, deletion_token) if sample_ids.present?
    hard_delete(user_id, workflow_run_ids + deprecated_workflow_run_ids, "WorkflowRun", :query_workflow_run_ids, :delete_workflow_runs, deletion_token) if workflow_run_ids.present?
    hard_delete(user_id, bulk_download_workflow_run_ids, "WorkflowRun", :query_workflow_run_ids, :delete_workflow_runs, deletion_token) if bulk_download_workflow_run_ids.present?
    hard_delete(user_id, bulk_download_entity_ids, "BulkDownload", :query_bulk_download_ids, :delete_bulk_downloads, deletion_token) if bulk_download_entity_ids.present?

    Rails.logger.info("Successfully hard deleted NextGen objects")
  rescue StandardError => e
    LogUtil.log_error(
      "NextGen Hard Deletion Failed: #{e}.",
      exception: e,
      nextgen_ids: {
        cg_ids: cg_ids,
        sample_ids: sample_ids,
        workflow_run_ids: workflow_run_ids,
        deprecated_workflow_run_ids: deprecated_workflow_run_ids,
        bulk_download_workflow_run_ids: bulk_download_workflow_run_ids,
        bulk_download_entity_ids: bulk_download_entity_ids,
      },
      user_id: user_id
    )
    raise e
  end

  def self.hard_delete(user_id, object_ids, object_type, query_fcn, mutation_fcn, token)
    Rails.logger.info("Hard deleting #{object_type} with ids #{object_ids}")
    soft_deleted_ids = send(query_fcn, user_id, object_ids, token)
    if soft_deleted_ids.sort != object_ids.sort
      raise "Failed to delete: not all object ids were marked as soft deleted"
    end

    deletion_logs_nextgen = NextgenDeletionLog.where(object_id: object_ids, user_id: user_id)
    if deletion_logs_nextgen.count != object_ids.count
      raise "Failed to delete: not all object ids have deletion logs"
    end

    deleted_ids = send(mutation_fcn, user_id, object_ids, token)

    deletion_logs_nextgen.select { |log| deleted_ids.include? log.object_id }.each do |log|
      log.update(hard_deleted_at: Time.now.utc)
    end

    if deleted_ids.sort != object_ids.sort
      raise "Failed to delete: not all object ids were deleted"
    end

    Rails.logger.info("Successfully hard deleted #{object_type} with ids #{deleted_ids}")
  end

  def self.query_cg_ids(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, GetSoftDeletedCGs, variables: { ids: ids }, token: token).data.consensus_genomes.map(&:id)
  end

  def self.delete_cgs(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, DeleteCGs, variables: { ids: ids }, token: token).data.delete_consensus_genome.map(&:id)
  end

  def self.query_workflow_run_ids(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, GetSoftDeletedWorkflowRuns, variables: { ids: ids }, token: token).data.workflow_runs.map(&:id)
  end

  def self.query_sample_ids(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, GetSoftDeletedSamples, variables: { ids: ids }, token: token).data.samples.map(&:id)
  end

  def self.query_bulk_download_ids(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, GetSoftDeletedBulkDownloads, variables: { ids: ids }, token: token).data.bulkDownloads.map(&:id)
  end

  def self.delete_workflow_runs(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, DeleteWorkflowRuns, variables: { ids: ids }, token: token).data.delete_workflow_run.map(&:id)
  end

  def self.delete_samples(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, DeleteSamples, variables: { ids: ids }, token: token).data.delete_sample.map(&:id)
  end

  def self.delete_bulk_downloads(user_id, ids, token)
    CzidGraphqlFederation.query_with_token(user_id, DeleteBulkDownloads, variables: { ids: ids }, token: token).data.delete_bulk_download.map(&:id)
  end
end
