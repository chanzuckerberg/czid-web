class KickoffPhyloTree
  @queue = :q03_pipeline_run
  def self.perform(phylo_tree_id)
    Rails.logger.info("Start preparing taxon fasta files for phylo_tree #{phylo_tree_id}")
    PhyloTree.find(phylo_tree_id).kickoff
  rescue
    Airbrake.notify("File preparation / batch job submission failed for phylo_tree #{phylo_tree_id}")
  end
end
