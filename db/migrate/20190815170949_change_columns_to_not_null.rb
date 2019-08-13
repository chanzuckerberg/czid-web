# TODO: (gdingle):  before_create :create_output_states, :create_run_stages, unless: :results_finalized?

class ChangeColumnsToNotNull < ActiveRecord::Migration[5.1]
  def change
    change_column_null :pipeline_run_stages, :pipeline_run_id, false
    change_column_null :pipeline_run_stages, :step_number, false
    change_column_null :pipeline_run_stages, :job_command_func, false
    change_column_null :pipeline_run_stages, :name, false
    set_column_comment :pipeline_run_stages, :failed_jobs, "For retrying failed AWS jobs"

    change_column_null :alignment_configs, :name, false
    change_column_null :alignment_configs, :s3_nt_db_path, false
    change_column_null :alignment_configs, :s3_nt_loc_db_path, false
    change_column_null :alignment_configs, :s3_nr_db_path, false
    change_column_null :alignment_configs, :s3_nr_loc_db_path, false
    change_column_null :alignment_configs, :s3_lineage_path, false
    change_column_null :alignment_configs, :s3_accession2taxid_path, false
    change_column_null :alignment_configs, :s3_deuterostome_db_path, false
    change_column_null :alignment_configs, :lineage_version, false

    # TODO: (gdingle): why is already name not null in schema?
    change_column_null :host_genomes, :name, false
    change_column_null :host_genomes, :s3_star_index_path, false
    change_column_null :host_genomes, :s3_bowtie2_index_path, false
    change_column_null :host_genomes, :default_background_id, false
    set_column_comment :host_genomes, :skip_deutero_filter, "Whenever we add a new host genome, we need to check if it's a deuterostome or not and set this accordingly. For mammals, deuterostome filtering should be performed."

    change_column_null :input_files, :name, false
    change_column_null :input_files, :sample_id, false
    change_column_null :input_files, :source_type, false
    change_column_null :input_files, :source, false

    change_column_null :metadata_fields, :display_name, false
    change_column_null :metadata_fields, :force_options, false
    change_column_null :metadata_fields, :is_core, false
    change_column_null :metadata_fields, :is_default, false
    change_column_null :metadata_fields, :is_required, false
    change_column_null :metadata_fields, :default_for_new_host_genome, false
    set_column_comment :metadata_fields, :examples,
                       "Examples are used on the metadata dictionary page. They list some
                 examples of what the user should enter for the field."
    set_column_comment :metadata_fields, :options, "For some metadata fields, the user is only allowed to input certain values. The
options field lists what these values are. This won't apply to most fields."

    change_column_null :output_states, :output, false
    change_column_null :output_states, :pipeline_run_id, false

    change_column_null :pipeline_runs, :sample_id, false
    change_column_null :pipeline_runs, :results_finalized, false
    change_column_null :pipeline_runs, :alignment_config_id, false
    change_column_null :pipeline_runs, :alert_sent, false

    change_column_null :taxon_counts, :tax_id, false
    change_column_null :taxon_counts, :tax_level, false
    change_column_null :taxon_counts, :count, false
    change_column_null :taxon_counts, :count_type, false
    change_column_null :taxon_counts, :percent_identity, false
    change_column_null :taxon_counts, :alignment_length, false
    change_column_null :taxon_counts, :e_value, false
    change_column_null :taxon_counts, :pipeline_run_id, false

    change_column_null :users, :email, false
    change_column_null :users, :name, false
    change_column_null :users, :encrypted_password, false
    change_column_null :users, :authentication_token, false

    change_column_null :backgrounds, :name, false
    change_column_null :backgrounds, :ready, false

    change_column_null :job_stats, :task, false
    change_column_null :job_stats, :reads_after, false
    change_column_null :job_stats, :pipeline_run_id, false

    change_column_null :locations, :osm_id, false
    change_column_null :locations, :locationiq_id, false
    change_column_null :locations, :lat, false
    change_column_null :locations, :lng, false

    change_column_null :metadata, :sample_id, false
    change_column_null :metadata, :metadata_field_id, false

    change_column_null :phylo_trees, :taxid, false
    change_column_null :phylo_trees, :tax_level, false
    change_column_null :phylo_trees, :tax_name, false
    change_column_null :phylo_trees, :user_id, false
    change_column_null :phylo_trees, :project_id, false
    change_column_null :phylo_trees, :status, false
    change_column_null :phylo_trees, :name, false
    set_column_comment :phylo_trees, :dag_json, "Populated after phylo_tree pipeline kickoff"
    set_column_comment :phylo_trees, :command_stdout, "Populated after phylo_tree pipeline kickoff"
    set_column_comment :phylo_trees, :command_stderr, "Populated after phylo_tree pipeline kickoff"
    set_column_comment :phylo_trees, :job_id, "Populated after phylo_tree pipeline kickoff"

    change_column_null :samples, :name, false
    change_column_null :samples, :project_id, false
    change_column_null :samples, :status, false
    change_column_null :samples, :s3_star_index_path, false
    change_column_null :samples, :s3_bowtie2_index_path, false
    change_column_null :samples, :host_genome_id, false
    change_column_null :samples, :user_id, false
    change_column_null :samples, :web_commit, false
    change_column_null :samples, :pipeline_commit, false
    change_column_null :samples, :uploaded_from_basespace, false
    set_column_comment :samples, :s3_star_index_path, "Copied from host_genome on sample creation"
    set_column_comment :samples, :s3_bowtie2_index_path, "Copied from host_genome on sample creation"

    change_column_null :taxon_byteranges, :taxid, false
    change_column_null :taxon_byteranges, :first_byte, false
    change_column_null :taxon_byteranges, :last_byte, false
    change_column_null :taxon_byteranges, :hit_type, false
    change_column_null :taxon_byteranges, :pipeline_run_id, false

    change_column_null :taxon_scoring_models, :name, false
    change_column_null :taxon_scoring_models, :model_json, false

    change_column_null :taxon_summaries, :background_id, false
    change_column_null :taxon_summaries, :tax_id, false
    change_column_null :taxon_summaries, :count_type, false
    change_column_null :taxon_summaries, :tax_level, false
    change_column_null :taxon_summaries, :mean, false
    change_column_null :taxon_summaries, :stdev, false
    # NOTE: uncomment this line if the migration fails with "Invalid use of NULL value"
    # delete_bad_rows :taxon_summaries, :rpm_list
    change_column_null :taxon_summaries, :rpm_list, false

    change_column_null :visualizations, :user_id, false
    change_column_null :visualizations, :visualization_type, false
    change_column_null :visualizations, :data, false

    # NOTE: uncomment this line if the migration fails with "Invalid use of NULL value"
    # delete_bad_rows :visualizations, :name
    change_column_null :visualizations, :name, false
    set_column_comment :visualizations, :user_id, "the user that saved the visualization"
    set_column_comment :visualizations, :visualization_type, "heatmap, phylo_tree or something else"
    set_column_comment :visualizations, :data, "visualization_type-specific state"
    set_column_comment :visualizations, :name, "a user-provided name"

    # START OF JUNCTION TABLES
    change_column_null :backgrounds_pipeline_runs, :background_id, false
    change_column_null :backgrounds_pipeline_runs, :pipeline_run_id, false

    change_column_null :backgrounds_samples, :background_id, false
    change_column_null :backgrounds_samples, :sample_id, false

    change_column_null :favorite_projects, :project_id, false
    change_column_null :favorite_projects, :user_id, false

    change_column_null :phylo_trees_pipeline_runs, :phylo_tree_id, false
    change_column_null :phylo_trees_pipeline_runs, :pipeline_run_id, false
    # END OF JUNCTION TABLES

    # START OF TABLES THAT ARE ALL NOT NULL
    change_column_null :amr_counts, :gene, false
    change_column_null :amr_counts, :allele, false
    change_column_null :amr_counts, :coverage, false
    change_column_null :amr_counts, :depth, false
    change_column_null :amr_counts, :pipeline_run_id, false
    change_column_null :amr_counts, :drug_family, false

    change_column_null :archived_backgrounds, :archive_of, false
    change_column_null :archived_backgrounds, :data, false
    change_column_null :archived_backgrounds, :s3_backup_path, false

    change_column_null :contigs, :pipeline_run_id, false
    change_column_null :contigs, :name, false
    change_column_null :contigs, :sequence, false
    change_column_null :contigs, :read_count, false
    delete_bad_rows :contigs, :lineage_json
    change_column_null :contigs, :lineage_json, false

    change_column_null :ercc_counts, :pipeline_run_id, false
    change_column_null :ercc_counts, :name, false
    change_column_null :ercc_counts, :count, false

    change_column_null :projects, :name, false
    change_column_default :projects, :public_access, from: nil, to: 0
    change_column_null :projects, :public_access, false
    change_column_null :projects, :background_flag, false

    change_column_null :taxon_descriptions, :wikipedia_id, false
    change_column_null :taxon_descriptions, :title, false
    change_column_null :taxon_descriptions, :summary, false
    change_column_null :taxon_descriptions, :description, false

    # defaults taken from label_top_scoring_taxa
    change_column_default :ui_configs, :min_nt_z, from: nil, to: 1
    change_column_null :ui_configs, :min_nt_z, false
    change_column_default :ui_configs, :min_nr_z, from: nil, to: 1
    change_column_null :ui_configs, :min_nr_z, false
    change_column_default :ui_configs, :min_nt_rpm, from: nil, to: 1
    change_column_null :ui_configs, :min_nt_rpm, false
    change_column_default :ui_configs, :min_nr_rpm, from: nil, to: 1
    change_column_null :ui_configs, :min_nr_rpm, false
    change_column_default :ui_configs, :top_n, from: nil, to: 3
    change_column_null :ui_configs, :top_n, false
    # END OF TABLES THAT ARE ALL NOT NULL
  end

  private

  def delete_bad_rows(table, column)
    sql = "DELETE t
    FROM #{table} t
    WHERE `t`.`#{column}` IS NULL;"

    ActiveRecord::Base.connection.execute(sql)
  end
end
