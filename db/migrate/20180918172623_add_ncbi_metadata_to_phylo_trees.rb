class AddNcbiMetadataToPhyloTrees < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :ncbi_metadata, :text
  end
end
