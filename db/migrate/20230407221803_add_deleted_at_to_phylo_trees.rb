class AddDeletedAtToPhyloTrees < ActiveRecord::Migration[6.1]
  def change
    add_column :phylo_trees, :deleted_at, :datetime, comment: "When the user triggered deletion of the phylo tree"
    add_column :phylo_tree_ngs, :deleted_at, :datetime, comment: "When the user triggered deletion of the phylo tree"
  end
end
