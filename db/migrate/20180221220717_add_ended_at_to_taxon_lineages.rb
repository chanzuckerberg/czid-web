class AddEndedAtToTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_lineages, :started_at, :datetime, default: DateTime.new(2000), null: false
    add_column :taxon_lineages, :ended_at, :datetime, default: DateTime.new(3000), null: false
    remove_index :taxon_lineages, name: 'index_taxon_lineages_on_taxid'
    add_index :taxon_lineages, [:taxid, :started_at], unique: true, name: 'index_taxon_lineages_on_taxid_and_start'
    add_index :taxon_lineages, [:taxid, :ended_at], unique: true, name: 'index_taxon_lineages_on_taxid_and_end'
  end
end
