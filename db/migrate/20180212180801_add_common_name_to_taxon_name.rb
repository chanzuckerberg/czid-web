class AddCommonNameToTaxonName < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_names, :common_name, :string
    add_column :taxon_lineages, :superkingdom_common_name, :string
    add_column :taxon_lineages, :phylum_common_name, :string
    add_column :taxon_lineages, :class_common_name, :string
    add_column :taxon_lineages, :order_common_name, :string
    add_column :taxon_lineages, :family_common_name, :string
    add_column :taxon_lineages, :genus_common_name, :string
    add_column :taxon_lineages, :species_common_name, :string
  end
end
