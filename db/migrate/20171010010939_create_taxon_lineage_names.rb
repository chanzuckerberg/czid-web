class CreateTaxonLineageNames < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_lineage_names do |t|
      t.integer :taxid
      t.string :superkingdom_name
      t.string :phylum_name
      t.string :class_name
      t.string :order_name
      t.string :family_name
      t.string :genus_name
      t.string :species_name

      t.timestamps
    end
  end
end
