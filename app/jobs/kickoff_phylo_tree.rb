class KickoffPhyloTree
  extend InstrumentedJob

  @queue = :q03_pipeline_run
  def self.perform(phylo_tree_id)
    Rails.logger.info("Start preparing DAG for phylo_tree #{phylo_tree_id}")
    PhyloTree.find(phylo_tree_id).kickoff
  rescue StandardError
    failure_message = "Batch job submission failed for phylo_tree #{phylo_tree_id}"
    Rails.logger.error(failure_message)
    LogUtil.log_err(failure_message)
    PhyloTree.find(phylo_tree_id).update(status: PhyloTree::STATUS_FAILED)
    raise # Raise error in order to fire on_failure resque hook in InstrumentedJob
  end
end
