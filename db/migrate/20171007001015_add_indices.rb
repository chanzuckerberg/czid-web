class AddIndices < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_zscores, [:report_id, :hit_type, :tax_level, :tax_id], unique: true, name: "index_taxon_zscores_detailed"
    add_index :taxon_counts, [:pipeline_output_id, :count_type, :tax_level, :tax_id], unique: true, name: "index_taxon_counts_detailed"
    add_index :taxon_names, :taxid, unique: true
    add_index :taxon_lineages, :taxid, unique: true
    add_index :taxon_child_parents, :taxid, unique: true
    add_index :taxon_categories, :taxid, unique: true
    add_index :projects_users, :project_id
    add_index :projects_users, :user_id
    add_index :backgrounds_samples, :background_id
    add_index :backgrounds_samples, :sample_id
    add_index :backgrounds_pipeline_outputs, :background_id
    add_index :backgrounds_pipeline_outputs, :pipeline_output_id
  end
end
