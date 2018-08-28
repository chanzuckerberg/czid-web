class AddIndexToTaxonLineage < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_lineages, [:taxid, :started_at, :ended_at]
  end
end
