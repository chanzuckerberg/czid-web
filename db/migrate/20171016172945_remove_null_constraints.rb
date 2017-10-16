class RemoveNullConstraints < ActiveRecord::Migration[5.1]
  def change
    change_column_null :taxon_lineages, :superkingdom_taxid, true
    change_column_null :taxon_lineages, :phylum_taxid, true
    change_column_null :taxon_lineages, :class_taxid, true
    change_column_null :taxon_lineages, :order_taxid, true
    change_column_null :taxon_lineages, :family_taxid, true
    change_column_null :taxon_lineages, :genus_taxid, true
    change_column_null :taxon_lineages, :species_taxid, true
  end
end
