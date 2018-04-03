class AddKingdomToTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_lineages, :kingdom_taxid, :integer, default: TaxonLineage::MISSING_KINGDOM_ID, null: false
    add_column :taxon_lineages, :kingdom_name, :string, default: '', null: false
    add_column :taxon_lineages, :kingdom_common_name, :string, default: '', null: false

    change_column :taxon_lineages, :species_taxid, :integer, default: TaxonLineage::MISSING_SPECIES_ID, null: false
    change_column :taxon_lineages, :genus_taxid, :integer, default: TaxonLineage::MISSING_GENUS_ID, null: false
    change_column :taxon_lineages, :family_taxid, :integer, default: TaxonLineage::MISSING_FAMILY_ID, null: false
    change_column :taxon_lineages, :order_taxid, :integer, default: TaxonLineage::MISSING_ORDER_ID, null: false
    change_column :taxon_lineages, :class_taxid, :integer, default: TaxonLineage::MISSING_CLASS_ID, null: false
    change_column :taxon_lineages, :phylum_taxid, :integer, default: TaxonLineage::MISSING_PHYLUM_ID, null: false
    change_column :taxon_lineages, :superkingdom_taxid, :integer, default: TaxonLineage::MISSING_SUPERKINGDOM_ID, null: false

    change_column :taxon_lineages, :species_name, :string, default: '', null: false
    change_column :taxon_lineages, :genus_name, :string, default: '', null: false
    change_column :taxon_lineages, :family_name, :string, default: '', null: false
    change_column :taxon_lineages, :order_name, :string, default: '', null: false
    change_column :taxon_lineages, :class_name, :string, default: '', null: false
    change_column :taxon_lineages, :phylum_name, :string, default: '', null: false
    change_column :taxon_lineages, :superkingdom_name, :string, default: '', null: false

    change_column :taxon_lineages, :species_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :genus_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :family_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :order_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :class_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :phylum_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :superkingdom_common_name, :string, default: '', null: false
  end
end
