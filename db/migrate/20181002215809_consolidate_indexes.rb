class ConsolidateIndexes < ActiveRecord::Migration[5.1]
  def change
    drop_table :taxon_categories
    drop_table :taxon_child_parents
    drop_table :taxon_lineage_names
    drop_table :taxon_names

    remove_index :metadata, name: "index_metadata_on_key_and_sample_id"
    remove_index :metadata, name: "index_metadata_on_sample_id"
    add_index :metadata, [:sample_id, :key], unique: true

    remove_index :pipeline_run_stages, name: "index_pipeline_run_stages_on_pipeline_run_id"

    remove_index :taxon_byteranges, name: "index_taxon_byteranges_pr"
    remove_index :taxon_byteranges, name: "index_taxon_byteranges_on_details"
    remove_index :taxon_byteranges, name: "index_taxon_byteranges_on_taxid_and_hit_type"
    add_index :taxon_byteranges, ["pipeline_run_id", "taxid", "hit_type", "tax_level"], name: "index_pr_tax_ht_level_tb", unique: true

    remove_index :taxon_counts, name: "taxon_counts_pr_index"
    remove_index :taxon_counts, name: "taxon_counts_pr_index2"
    add_index :taxon_counts, ["pipeline_run_id", "tax_id", "count_type", "tax_level"], name: "index_pr_tax_hit_level_tc", unique: true

    remove_index :taxon_summaries, name: "index_taxon_summaries_detailed"
    remove_index :taxon_summaries, name: "index_taxon_summaries_on_background_id"
    add_index :taxon_summaries, ["background_id", "tax_id", "count_type", "tax_level"], name: "index_bg_tax_ct_level", unique: true

    add_index :favorite_projects, [:user_id]
    add_index :favorite_projects, [:project_id]
  end
end
