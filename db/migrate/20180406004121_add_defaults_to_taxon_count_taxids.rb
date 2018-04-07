class AddDefaultsToTaxonCountTaxids < ActiveRecord::Migration[5.1]
  def change
    TaxonCount.where(genus_taxid: nil).update_all(genus_taxid: TaxonLineage::MISSING_GENUS_ID)
    TaxonCount.where(family_taxid: nil).update_all(family_taxid: TaxonLineage::MISSING_FAMILY_ID)
    TaxonCount.where(superkingdom_taxid: nil).update_all(superkingdom_taxid: TaxonLineage::MISSING_SUPERKINGDOM_ID)

    change_column :taxon_counts, :genus_taxid, :integer, default: TaxonLineage::MISSING_GENUS_ID, null: false
    change_column :taxon_counts, :family_taxid, :integer, default: TaxonLineage::MISSING_FAMILY_ID, null: false
    change_column :taxon_counts, :superkingdom_taxid, :integer, default: TaxonLineage::MISSING_SUPERKINGDOM_ID, null: false
  end
end
