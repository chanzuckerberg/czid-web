class AddForeignKeyConstraints < ActiveRecord::Migration[5.1]
  def change
    add_foreign_key "amr_counts", "pipeline_runs", name: "amr_counts_pipeline_run_id_fk"
    add_foreign_key "contigs", "pipeline_runs", name: "contigs_pipeline_run_id_fk"
    add_foreign_key "ercc_counts", "pipeline_runs", name: "ercc_counts_pipeline_run_id_fk"
    add_foreign_key "favorite_projects", "projects", name: "favorite_projects_project_id_fk"
    add_foreign_key "favorite_projects", "users", name: "favorite_projects_user_id_fk"
    add_foreign_key "input_files", "samples", name: "input_files_sample_id_fk"
    add_foreign_key "job_stats", "pipeline_runs", name: "job_stats_pipeline_run_id_fk"
    add_foreign_key "metadata", "metadata_fields", name: "metadata_metadata_field_id_fk"
    add_foreign_key "metadata", "samples", name: "metadata_sample_id_fk"
    add_foreign_key "output_states", "pipeline_runs", name: "output_states_pipeline_run_id_fk"
    add_foreign_key "phylo_trees", "projects", name: "phylo_trees_project_id_fk"
    add_foreign_key "phylo_trees", "users", name: "phylo_trees_user_id_fk"
    add_foreign_key "pipeline_run_stages", "pipeline_runs", name: "pipeline_run_stages_pipeline_run_id_fk"
    add_foreign_key "pipeline_runs", "alignment_configs", name: "pipeline_runs_alignment_config_id_fk"
    add_foreign_key "pipeline_runs", "samples", name: "pipeline_runs_sample_id_fk"
    add_foreign_key "samples", "host_genomes", name: "samples_host_genome_id_fk"
    add_foreign_key "samples", "projects", name: "samples_project_id_fk"
    add_foreign_key "samples", "users", name: "samples_user_id_fk"
    add_foreign_key "taxon_summaries", "backgrounds", name: "taxon_summaries_background_id_fk"
    add_foreign_key "visualizations", "users", name: "visualizations_user_id_fk"
  end
end
