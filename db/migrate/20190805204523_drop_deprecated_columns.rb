class DropDeprecatedColumns < ActiveRecord::Migration[5.1]
  def change
    remove_column :metadata_fields, :validation_type

    remove_column :metadata, :specificity

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

    remove_columns :backgrounds, :project_id

    remove_columns :job_stats, :reads_before

    # this col is completely NULL
    remove_column :taxon_byteranges, :tax_level

    # this col is completely NULL
    remove_column :taxon_scoring_models, :user_id

    # this col is completely NULL
    remove_column :taxon_summaries, :name
  end
end
