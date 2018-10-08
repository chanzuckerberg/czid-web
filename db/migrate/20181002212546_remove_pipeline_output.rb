class RemovePipelineOutput < ActiveRecord::Migration[5.1]
  def change
    # Pipeline Output
    drop_table :backgrounds_pipeline_outputs
    drop_table :pipeline_outputs
    remove_column :job_stats, :pipeline_output_id
    remove_column :pipeline_runs, :pipeline_output_id
    remove_column :taxon_byteranges, :pipeline_output_id
    remove_index :taxon_counts, name: "index_taxon_counts"
    remove_index :taxon_counts, name: "new_index_taxon_counts"
    remove_column :taxon_counts, :pipeline_output_id
  end
end
