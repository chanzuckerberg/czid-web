class AddKingdomTaxidToTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :kingdom_taxid, :integer, default: TaxonLineage::MISSING_KINGDOM_ID, null: false
  end
end
