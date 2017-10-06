class ChangeTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    change_column :taxon_lineages, :phylum_taxid, :integer, null: false
    change_column :taxon_lineages, :class_taxid, :integer, null: false
    change_column :taxon_lineages, :order_taxid, :integer, null: false
    change_column :taxon_lineages, :family_taxid, :integer, null: false
    change_column :taxon_lineages, :genus_taxid, :integer, null: false
    change_column :taxon_lineages, :species_taxid, :integer, null: false
  end
end
