class AddIsPhageToTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :phylum_taxid, :integer, null: false, default: TaxonLineage::MISSING_PHYLUM_ID
    add_column :taxon_counts, :is_phage, :tinyint, null: false, default: 0
  end
end
