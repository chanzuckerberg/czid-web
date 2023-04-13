# Scrapes the DB for any pipeline runs or workflow runs
# that were soft deleted more than {DELAY} hours ago
# and logs Sentry error if any are found.
# DELAY is flexible but should be long enough that the on-demand
# async job hard-deleting data should have finished a while ago.
class CheckSoftDeletedData
  extend InstrumentedJob

  @queue = :check_soft_deleted_data

  DELAY = 3.hours

  class SoftDeletedDataError < StandardError
    def initialize
      super("Hard deletion failed: soft deleted data found in database.")
    end
  end

  def self.perform
    Rails.logger.info("Checking database for old soft deleted data")
    check_for_soft_deleted_data
    Rails.logger.info("Finished checking database for old soft deleted data")
  rescue StandardError => e
    LogUtil.log_error(
      "Unexpected error encountered while checking database for soft deleted data",
      exception: e
    )
    raise e
  end

  def self.check_for_soft_deleted_data
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
  end
end
