class AddPipelineRunIndices < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_counts, ["pipeline_run_id", "tax_id", "count_type"], name: "taxon_counts_pr_index", unique: true
   add_index :taxon_counts, ["pipeline_run_id", "tax_level", "count_type", "tax_id"], name: "taxon_counts_pr_index2", unique: true
   add_index :job_stats, [:pipeline_run_id]
   add_index :taxon_byteranges, ["pipeline_run_id", "tax_level", "hit_type", "taxid"], name:       "index_taxon_byteranges_pr", unique: true
  end
end
