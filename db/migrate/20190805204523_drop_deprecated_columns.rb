class DropDeprecatedColumns < ActiveRecord::Migration[5.1]
  def change
    remove_column :pipeline_run_stages, :failed_jobs

    remove_column :metadata_fields, :validation_type

    # wait for boris
    remove_column :pipeline_runs, :version
    remove_column :pipeline_runs, :ready_step

    remove_column :pipeline_runs, :job_id
    remove_column :pipeline_runs, :command
    remove_column :pipeline_runs, :command_stdout
    remove_column :pipeline_runs, :command_error
    remove_column :pipeline_runs, :command_status
    remove_column :pipeline_runs, :job_description
    remove_column :pipeline_runs, :job_log_id
    remove_column :pipeline_runs, :postprocess_status
    remove_column :pipeline_runs, :assembled_taxids

    remove_column :taxon_counts, :percent_concordant
    remove_column :taxon_counts, :species_total_concordant
    remove_column :taxon_counts, :genus_total_concordant
    remove_column :taxon_counts, :family_total_concordant

    # TODO: (gdingle): verify below this line
    remove_columns :backgrounds, :project_id

    remove_columns :job_stats, :reads_before

    remove_column :metadata, :specificity

    remove_column :samples, :subsample
    remove_column :samples, :sample_detection
    remove_column :samples, :max_input_fragments
    # TODO: (gdingle): after data migration drop sample_organism, sample_*

    remove_column :taxon_byteranges, :tax_level

    remove_column :taxon_scoring_models, :user_id

    remove_column :taxon_summaries, :name
  end
end
