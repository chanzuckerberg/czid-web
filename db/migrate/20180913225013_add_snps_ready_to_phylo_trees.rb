class AddSnpsReadyToPhyloTrees < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :snps_ready, :tinyint, default: 0
  end
end
