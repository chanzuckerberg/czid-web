# Scrapes the DB for any pipeline runs or workflow runs
# that were soft deleted more than {DELAY} hours ago
# and logs Sentry error if any are found.
# DELAY is flexible but should be long enough that the on-demand
# async job hard-deleting data should have finished a while ago.
class CheckSoftDeletedData
  extend InstrumentedJob

  @queue = :check_soft_deleted_data

  DELAY = 3.hours

  GetSoftDeletedCGs = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($time: DateTime!){
      consensusGenomes (where: {
        deletedAt: { _lt: $time }
      }) {
        id
      }
    }
  GRAPHQL

  GetSoftDeletedSamples = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($time: DateTime!){
      samples (where: {
        deletedAt: { _lt: $time  }
      }) {
        id
      }
    }
  GRAPHQL

  GetSoftDeletedWorkflowRuns = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($time: DateTime!){
      workflowRuns (where: {
        deletedAt: { _lt: $time }
      }) {
        id
      }
    }
  GRAPHQL

  GetSoftDeletedBulkDownloads = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($time: DateTime!){
      bulkDownloads (where: {
        deletedAt: { _lt: $time }
      }) {
        id
      }
    }
  GRAPHQL

  class SoftDeletedDataError < StandardError
    def initialize
      super("ACTION REQUIRED: Hard deletion failed. Soft deleted data found in database. Manual deletion by on-call required.")
    end
  end

  def self.perform
    Rails.logger.info("Checking database for old soft deleted data")
    check_for_soft_deleted_data_rails
    check_for_soft_deleted_data_nextgen
    Rails.logger.info("Finished checking database for old soft deleted data")
  rescue StandardError => e
    LogUtil.log_error(
      "Unexpected error encountered while checking database for soft deleted data",
      exception: e
    )
    raise e
  end

  def self.check_for_soft_deleted_data_rails
    deleted_prs = PipelineRun.where("deleted_at < ?", Time.now.utc - DELAY)
    unless deleted_prs.empty?
      LogUtil.log_error(
        "Soft deleted pipeline runs found in database",
        exception: SoftDeletedDataError.new,
        pipeline_run_ids: deleted_prs.pluck(:id)
      )
    end

    deleted_wrs = WorkflowRun.where("deleted_at < ?", Time.now.utc - DELAY)
    unless deleted_wrs.empty?
      LogUtil.log_error(
        "Soft deleted workflow runs found in database",
        exception: SoftDeletedDataError.new,
        workflow_run_ids: deleted_wrs.pluck(:id)
      )
    end

    deleted_samples = Sample.where("deleted_at < ?", Time.now.utc - DELAY)
    unless deleted_samples.empty?
      LogUtil.log_error(
        "Soft deleted samples found in database",
        exception: SoftDeletedDataError.new,
        sample_ids: deleted_samples.pluck(:id)
      )
    end

    deleted_phylo_tree = PhyloTree.where("deleted_at < ?", Time.now.utc - DELAY)
    unless deleted_phylo_tree.empty?
      LogUtil.log_error(
        "Soft deleted phylo trees (deprecated) found in database",
        exception: SoftDeletedDataError.new,
        phylo_tree_ids: deleted_phylo_tree.pluck(:id)
      )
    end

    deleted_phylo_tree_ng = PhyloTreeNg.where("deleted_at < ?", Time.now.utc - DELAY)
    unless deleted_phylo_tree_ng.empty?
      LogUtil.log_error(
        "Soft deleted phylo trees found in database",
        exception: SoftDeletedDataError.new,
        phylo_tree_ng_ids: deleted_phylo_tree_ng.pluck(:id)
      )
    end

    deleted_bulk_downloads = BulkDownload.where("deleted_at < ?", Time.now.utc - DELAY)
    unless deleted_bulk_downloads.empty?
      LogUtil.log_error(
        "Soft deleted bulk downloads found in database",
        exception: SoftDeletedDataError.new,
        bulk_download_ids: deleted_bulk_downloads.pluck(:id)
      )
    end
  end

  def self.check_for_soft_deleted_data_nextgen
    system_user_id = ENV["SYSTEM_USER_ID"]
    token = TokenCreationService.call(user_id: system_user_id, should_include_project_claims: true)["token"]
    time = Time.now.utc - DELAY
    soft_deleted_cgs = CzidGraphqlFederation.query_with_token(system_user_id, GetSoftDeletedCGs, variables: { time: time }, token: token)
    if soft_deleted_cgs.present?
      LogUtil.log_error(
        "Soft deleted NextGen consensus genomes found in database",
        exception: SoftDeletedDataError.new,
        consensus_genome_ids: soft_deleted_cgs.map(&:id)
      )
    end

    soft_deleted_samples = CzidGraphqlFederation.query_with_token(system_user_id, GetSoftDeletedSamples, variables: { time: time }, token: token)
    if soft_deleted_samples.present?
      LogUtil.log_error(
        "Soft deleted NextGen samples found in database",
        exception: SoftDeletedDataError.new,
        sample_ids: soft_deleted_samples.map(&:id)
      )
    end

    soft_deleted_workflow_runs = CzidGraphqlFederation.query_with_token(system_user_id, GetSoftDeletedWorkflowRuns, variables: { time: time }, token: token)
    if soft_deleted_workflow_runs.present?
      LogUtil.log_error(
        "Soft deleted NextGen workflow runs found in database",
        exception: SoftDeletedDataError.new,
        workflow_run_ids: soft_deleted_workflow_runs.map(&:id)
      )
    end

    soft_deleted_bulk_downloads = CzidGraphqlFederation.query_with_token(system_user_id, GetSoftDeletedBulkDownloads, variables: { time: time }, token: token)
    if soft_deleted_bulk_downloads.present?
      LogUtil.log_error(
        "Soft deleted NextGen bulk downloads found in database",
        exception: SoftDeletedDataError.new,
        bulk_download_ids: soft_deleted_bulk_downloads.map(&:id)
      )
    end
  end
end
