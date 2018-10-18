class AddReadyAtToPhyloTrees < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :ready_at, :datetime
  end
end
