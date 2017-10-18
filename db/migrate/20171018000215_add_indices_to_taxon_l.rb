class AddIndicesToTaxonL < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_lineages, :species_taxid
    add_index :taxon_lineages, :genus_taxid
    add_index :taxon_lineages, :family_taxid
    add_index :taxon_lineages, :order_taxid
    add_index :taxon_lineages, :class_taxid
    add_index :taxon_lineages, :phylum_taxid
    add_index :taxon_lineages, :superkingdom_taxid
  end
end
