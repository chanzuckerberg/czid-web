class ChangeIndices < ActiveRecord::Migration[5.1]
  def change
    remove_index :taxon_zscores, name: "index_taxon_zscores_detailed"
    add_index :taxon_zscores, [:report_id, :tax_level, :hit_type, :tax_id], unique: true, name: "index_taxon_zscores"
    remove_index :taxon_counts, name: "index_taxon_counts_detailed"
    add_index :taxon_counts, [:pipeline_output_id, :tax_level, :count_type, :tax_id], unique: true, name: "index_taxon_counts"
  end
end
