class KickoffPhyloTree
  @queue = :q03_pipeline_run
  def self.perform(phylo_tree_id)
    Rails.logger.info("Start preparing DAG for phylo_tree #{phylo_tree_id}")
    PhyloTree.find(phylo_tree_id).kickoff
  rescue
    failure_message = "Batch job submission failed for phylo_tree #{phylo_tree_id}"
    Rails.logger.error(failure_message)
    LogUtil.log_err_and_airbrake(failure_message)
    PhyloTree.find(phylo_tree_id).update(status: PhyloTree::STATUS_FAILED)
  end
end
