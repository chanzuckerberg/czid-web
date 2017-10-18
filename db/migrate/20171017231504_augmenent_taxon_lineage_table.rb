class AugmenentTaxonLineageTable < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_lineages, :superkingdom_name, :string
    add_column :taxon_lineages, :phylum_name, :string
    add_column :taxon_lineages, :class_name, :string
    add_column :taxon_lineages, :order_name, :string
    add_column :taxon_lineages, :family_name, :string
    add_column :taxon_lineages, :genus_name, :string
    add_column :taxon_lineages, :species_name, :string
  end
end
