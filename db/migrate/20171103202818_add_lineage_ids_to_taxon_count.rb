class AddLineageIdsToTaxonCount < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :genus_taxid, :integer
    add_column :taxon_counts, :superkingdom_taxid, :integer
  end
end
