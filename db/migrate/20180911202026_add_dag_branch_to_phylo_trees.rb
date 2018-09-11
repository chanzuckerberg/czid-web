class AddDagBranchToPhyloTrees < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :dag_branch, :string
  end
end
