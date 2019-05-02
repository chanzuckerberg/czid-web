class AddIndexTaxIdToTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_counts, :tax_id
  end
end
