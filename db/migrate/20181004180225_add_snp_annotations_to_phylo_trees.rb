class AddSnpAnnotationsToPhyloTrees < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :snp_annotations, :string
  end
end
