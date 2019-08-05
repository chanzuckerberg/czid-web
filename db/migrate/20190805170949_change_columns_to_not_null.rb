# TODO: (gdingle): also do junction tables
# TODO: (gdingle): also do tables that have cols thta are all NOT NULL
# TODO: (gdingle): change to presence true for all cols as well?
# TODO: (gdingle):  before_create :create_output_states, :create_run_stages, unless: :results_finalized?

class ChangeColumnsToNotNull < ActiveRecord::Migration[5.1]
  def change
    change_column_null :pipeline_run_stages, :pipeline_run_id, false
    change_column_null :pipeline_run_stages, :step_number, false
    change_column_null :pipeline_run_stages, :job_command_func, false
    change_column_null :pipeline_run_stages, :name, false

    change_column_null :alignment_configs, :name, false
    change_column_null :alignment_configs, :s3_nt_db_path, false
    change_column_null :alignment_configs, :s3_nt_loc_db_path, false
    change_column_null :alignment_configs, :s3_nr_db_path, false
    change_column_null :alignment_configs, :s3_nr_loc_db_path, false
    change_column_null :alignment_configs, :s3_lineage_path, false
    change_column_null :alignment_configs, :s3_accession2taxid_path, false
    change_column_null :alignment_configs, :s3_deuterostome_db_path, false
    change_column_null :alignment_configs, :lineage_version, false

    change_column_null :host_genomes, :name, false
    change_column_null :host_genomes, :s3_star_index_path, false
    change_column_null :host_genomes, :s3_bowtie2_index_path, false
    change_column_null :host_genomes, :default_background_id, false

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
    set_column_comment :metadata_fields, :example,
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

    change_column_null :taxon_lineages, :version_end, false
    change_column_null :taxon_lineages, :version_start, false

    change_column_null :backgrounds, :name, false
    change_column_null :backgrounds, :ready, false
    set_column_comment :backgrounds, :project_id, "deprecated"

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
    change_column_null :taxon_summaries, :rpm_list, false

    change_column_null :visualizations, :user_id, false
    change_column_null :visualizations, :visualization_type, false
    change_column_null :visualizations, :data, false
    change_column_null :visualizations, :name, false
    set_column_comment :visualizations, :user_id, "the user that saved the visualization"
    set_column_comment :visualizations, :visualization_type, "heatmap, phylo_tree or something else"
    set_column_comment :visualizations, :data, "visualization_type-specific state"
    set_column_comment :visualizations, :name, "a user-provided name"
  end
end
