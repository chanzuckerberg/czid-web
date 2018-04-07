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

    TaxonLineage.where(species_name: nil).update_all(species_name: '')
    TaxonLineage.where(genus_name: nil).update_all(genus_name: '')
    TaxonLineage.where(family_name: nil).update_all(family_name: '')
    TaxonLineage.where(order_name: nil).update_all(order_name: '')
    TaxonLineage.where(class_name: nil).update_all(class_name: '')
    TaxonLineage.where(phylum_name: nil).update_all(phylum_name: '')
    TaxonLineage.where(superkingdom_name: nil).update_all(superkingdom_name: '')

    change_column :taxon_lineages, :species_name, :string, default: '', null: false
    change_column :taxon_lineages, :genus_name, :string, default: '', null: false
    change_column :taxon_lineages, :family_name, :string, default: '', null: false
    change_column :taxon_lineages, :order_name, :string, default: '', null: false
    change_column :taxon_lineages, :class_name, :string, default: '', null: false
    change_column :taxon_lineages, :phylum_name, :string, default: '', null: false
    change_column :taxon_lineages, :superkingdom_name, :string, default: '', null: false

    TaxonLineage.where(species_common_name: nil).update_all(species_common_name: '')
    TaxonLineage.where(genus_common_name: nil).update_all(genus_common_name: '')
    TaxonLineage.where(family_common_name: nil).update_all(family_common_name: '')
    TaxonLineage.where(order_common_name: nil).update_all(order_common_name: '')
    TaxonLineage.where(class_common_name: nil).update_all(class_common_name: '')
    TaxonLineage.where(phylum_common_name: nil).update_all(phylum_common_name: '')
    TaxonLineage.where(superkingdom_common_name: nil).update_all(superkingdom_common_name: '')

    change_column :taxon_lineages, :species_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :genus_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :family_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :order_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :class_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :phylum_common_name, :string, default: '', null: false
    change_column :taxon_lineages, :superkingdom_common_name, :string, default: '', null: false
  end
end
