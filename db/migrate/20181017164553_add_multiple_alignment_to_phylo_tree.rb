class AddMultipleAlignmentToPhyloTree < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :multiple_alignment, :string
  end
end
