class AddVcfToPhyloTree < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :vcf, :string
  end
end
