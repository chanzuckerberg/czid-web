class AddForeignKeyConstraints < ActiveRecord::Migration[5.1]
  def up
    assign_user_to_samples
    add_foreign_key "samples", "users", name: "samples_user_id_fk"

    add_foreign_key "amr_counts", "pipeline_runs", name: "amr_counts_pipeline_run_id_fk"

    delete_bad_rows "backgrounds_pipeline_runs", "backgrounds"
    add_foreign_key "backgrounds_pipeline_runs", "backgrounds", name: "backgrounds_pipeline_runs_background_id_fk"

    add_foreign_key "backgrounds_pipeline_runs", "pipeline_runs", name: "backgrounds_pipeline_runs_pipeline_run_id_fk"
    add_foreign_key "backgrounds_samples", "backgrounds", name: "backgrounds_samples_background_id_fk"
    add_foreign_key "backgrounds_samples", "samples", name: "backgrounds_samples_sample_id_fk"

    delete_bad_rows "favorite_projects", "projects"
    add_foreign_key "favorite_projects", "projects", name: "favorite_projects_project_id_fk"

    delete_bad_rows "favorite_projects", "users"
    add_foreign_key "favorite_projects", "users", name: "favorite_projects_user_id_fk"

    delete_bad_rows "host_genomes_metadata_fields", "host_genomes"
    add_foreign_key "host_genomes_metadata_fields", "host_genomes", name: "host_genomes_metadata_fields_host_genome_id_fk"

    delete_bad_rows "host_genomes_metadata_fields", "metadata_fields"
    add_foreign_key "host_genomes_metadata_fields", "metadata_fields", name: "host_genomes_metadata_fields_metadata_field_id_fk"

    delete_bad_rows "input_files", "samples"
    add_foreign_key "input_files", "samples", name: "input_files_sample_id_fk"

    delete_bad_rows "job_stats", "pipeline_runs"
    add_foreign_key "job_stats", "pipeline_runs", name: "job_stats_pipeline_run_id_fk"

    add_foreign_key "metadata_fields_projects", "metadata_fields", name: "metadata_fields_projects_metadata_field_id_fk"
    add_foreign_key "metadata_fields_projects", "projects", name: "metadata_fields_projects_project_id_fk"
    add_foreign_key "metadata", "metadata_fields", name: "metadata_metadata_field_id_fk"

    delete_bad_rows "metadata", "samples"
    add_foreign_key "metadata", "samples", name: "metadata_sample_id_fk"

    delete_bad_rows "output_states", "pipeline_runs"
    add_foreign_key "output_states", "pipeline_runs", name: "output_states_pipeline_run_id_fk"

    add_foreign_key "phylo_trees_pipeline_runs", "phylo_trees", name: "phylo_trees_pipeline_runs_phylo_tree_id_fk"
    add_foreign_key "phylo_trees_pipeline_runs", "pipeline_runs", name: "phylo_trees_pipeline_runs_pipeline_run_id_fk"
    add_foreign_key "phylo_trees", "projects", name: "phylo_trees_project_id_fk"
    add_foreign_key "phylo_trees", "users", name: "phylo_trees_user_id_fk"

    delete_bad_rows "pipeline_run_stages", "pipeline_runs"
    add_foreign_key "pipeline_run_stages", "pipeline_runs", name: "pipeline_run_stages_pipeline_run_id_fk"

    add_foreign_key "pipeline_runs", "alignment_configs", name: "pipeline_runs_alignment_config_id_fk"
    add_foreign_key "pipeline_runs", "samples", name: "pipeline_runs_sample_id_fk"

    delete_bad_rows "projects_users", "projects"
    add_foreign_key "projects_users", "projects", name: "projects_users_project_id_fk"

    delete_bad_rows "projects_users", "users"
    add_foreign_key "projects_users", "users", name: "projects_users_user_id_fk"

    add_foreign_key "samples", "host_genomes", name: "samples_host_genome_id_fk"
    add_foreign_key "samples", "projects", name: "samples_project_id_fk"

    delete_bad_rows "samples_visualizations", "samples"
    add_foreign_key "samples_visualizations", "samples", name: "samples_visualizations_sample_id_fk"

    delete_bad_rows "samples_visualizations", "visualizations"
    add_foreign_key "samples_visualizations", "visualizations", name: "samples_visualizations_visualization_id_fk"

    delete_bad_rows "visualizations", "users"
    add_foreign_key "visualizations", "users", name: "visualizations_user_id_fk"
  end

  private

  def delete_bad_rows(table, assoc_table)
    sql = "DELETE t
    FROM #{table} t
    LEFT JOIN #{assoc_table} a ON t.#{assoc_table.singularize}_id = a.id
    WHERE a.id IS NULL;"

    ActiveRecord::Base.connection.execute(sql)
  end

  # Assigns a user to samples that are missing one from project members
  def assign_user_to_samples
    sql = "
      UPDATE samples t
      LEFT JOIN users a ON t.user_id = a.id
      JOIN projects p ON t.project_id = p.id
      JOIN (
        SELECT project_id, MIN(pu.user_id) AS user_id
        FROM projects_users pu
        JOIN users ON pu.user_id = users.id
        GROUP BY project_id
        ) ins
      ON p.id = ins.project_id
      SET t.user_id=ins.user_id
      WHERE a.id IS NULL
    "
    ActiveRecord::Base.connection.execute(sql)
  end
end
