class CreateTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_lineages do |t|
      t.integer :taxid
      t.integer :superkingdom_taxid
      t.integer :phylum_taxid
      t.integer :class_taxid
      t.integer :order_taxid
      t.integer :family_taxid
      t.integer :genus_taxid
      t.integer :species_taxid

      t.timestamps
    end
  end
end
