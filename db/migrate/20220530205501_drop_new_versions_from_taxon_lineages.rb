class DropNewVersionsFromTaxonLineages < ActiveRecord::Migration[6.1]
  def change
    safety_assured { change_table :taxon_lineages, bulk: true do |t|
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_start_new"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_versions_new"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_end_new"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_end"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_started_at_and_ended_at"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_start"
      t.remove :version_start_new
      t.remove :version_end_new
      t.remove :started_at
      t.remove :ended_at
    end }
  end
end
