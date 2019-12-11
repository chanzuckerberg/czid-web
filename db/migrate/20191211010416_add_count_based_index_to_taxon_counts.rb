class AddCountBasedIndexToTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_counts, [:pipeline_run_id, :count_type, :count], name: "index_tc_count"
  end
end
