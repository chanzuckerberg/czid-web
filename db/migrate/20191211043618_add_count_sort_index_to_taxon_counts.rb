class AddCountSortIndexToTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_counts, [:count_type, :count, :pipeline_run_id], name: "index_tc_count_sort"
  end
end
