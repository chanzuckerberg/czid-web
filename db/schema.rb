# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20_181_018_234_532) do
  create_table "alignment_configs", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "name"
    t.string "index_dir_suffix"
    t.text "s3_nt_db_path"
    t.text "s3_nt_loc_db_path"
    t.text "s3_nr_db_path"
    t.text "s3_nr_loc_db_path"
    t.text "s3_lineage_path"
    t.text "s3_accession2taxid_path"
    t.text "s3_deuterostome_db_path"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "amr_counts", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "gene"
    t.string "allele"
    t.float "coverage", limit: 24
    t.float "depth", limit: 24
    t.bigint "pipeline_run_id"
    t.string "drug_family"
    t.integer "level"
    t.float "drug_gene_coverage", limit: 24
    t.float "drug_gene_depth", limit: 24
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pipeline_run_id", "allele"], name: "index_amr_counts_on_pipeline_run_id_and_allele", unique: true
  end

  create_table "archived_backgrounds", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "archive_of"
    t.text "data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "s3_backup_path"
  end

  create_table "backgrounds", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "project_id"
    t.text "description"
    t.integer "public_access", limit: 1
    t.integer "ready", limit: 1, default: 0
    t.bigint "user_id"
    t.index ["name"], name: "index_backgrounds_on_name", unique: true
  end

  create_table "backgrounds_pipeline_runs", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "background_id"
    t.bigint "pipeline_run_id"
    t.index ["background_id", "pipeline_run_id"], name: "index_bg_pr_id", unique: true
  end

  create_table "backgrounds_samples", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "background_id", null: false
    t.bigint "sample_id", null: false
    t.index ["background_id"], name: "index_backgrounds_samples_on_background_id"
    t.index ["sample_id"], name: "index_backgrounds_samples_on_sample_id"
  end

  create_table "ercc_counts", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "pipeline_run_id"
    t.string "name"
    t.integer "count"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pipeline_run_id", "name"], name: "index_ercc_counts_on_pipeline_run_id_and_name", unique: true
  end

  create_table "favorite_projects", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "project_id"
    t.integer "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_favorite_projects_on_project_id"
    t.index ["user_id"], name: "index_favorite_projects_on_user_id"
  end

  create_table "host_genomes", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "name", null: false
    t.text "s3_star_index_path"
    t.text "s3_bowtie2_index_path"
    t.bigint "default_background_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "sample_memory"
    t.integer "skip_deutero_filter"
  end

  create_table "input_files", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "name"
    t.text "presigned_url"
    t.bigint "sample_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "source_type", null: false
    t.text "source"
    t.text "parts"
    t.index ["sample_id"], name: "index_input_files_on_sample_id"
  end

  create_table "job_stats", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "task"
    t.integer "reads_before"
    t.integer "reads_after"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "pipeline_run_id"
    t.index ["pipeline_run_id"], name: "index_job_stats_on_pipeline_run_id"
    t.index ["task"], name: "index_job_stats_on_task"
  end

  create_table "metadata", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "key", null: false
    t.integer "data_type", limit: 1, null: false
    t.string "text_raw_value"
    t.string "text_validated_value"
    t.float "number_raw_value", limit: 24
    t.float "number_validated_value", limit: 24
    t.integer "sample_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["sample_id", "key"], name: "index_metadata_on_sample_id_and_key", unique: true
  end

  create_table "output_states", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "output"
    t.string "state"
    t.bigint "pipeline_run_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pipeline_run_id", "output"], name: "index_output_states_on_pipeline_run_id_and_output", unique: true
  end

  create_table "phylo_trees", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "taxid"
    t.integer "tax_level"
    t.string "tax_name"
    t.bigint "user_id"
    t.bigint "project_id"
    t.text "newick"
    t.integer "status", default: 0
    t.string "dag_version"
    t.text "dag_json"
    t.text "command_stdout"
    t.text "command_stderr"
    t.string "job_id"
    t.string "job_log_id"
    t.text "job_description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.string "dag_branch"
    t.text "ncbi_metadata"
    t.string "snp_annotations"
    t.datetime "ready_at"
    t.string "vcf"
    t.index ["name"], name: "index_phylo_trees_on_name", unique: true
    t.index ["project_id", "taxid"], name: "index_phylo_trees_on_project_id_and_taxid"
    t.index ["user_id"], name: "index_phylo_trees_on_user_id"
  end

  create_table "phylo_trees_pipeline_runs", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "phylo_tree_id"
    t.bigint "pipeline_run_id"
    t.index ["phylo_tree_id", "pipeline_run_id"], name: "index_pt_pr_id", unique: true
  end

  create_table "pipeline_run_stages", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "pipeline_run_id"
    t.integer "step_number"
    t.integer "job_type"
    t.string "job_status"
    t.integer "db_load_status", default: 0, null: false
    t.text "job_command"
    t.text "command_stdout"
    t.text "command_stderr"
    t.string "command_status"
    t.text "job_description"
    t.string "job_log_id"
    t.float "job_progress_pct", limit: 24
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "job_command_func"
    t.string "load_db_command_func"
    t.string "job_id"
    t.string "output_func"
    t.string "name"
    t.text "failed_jobs"
    t.text "dag_json"
    t.index ["pipeline_run_id", "step_number"], name: "index_pipeline_run_stages_on_pipeline_run_id_and_step_number"
  end

  create_table "pipeline_runs", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "job_id"
    t.text "command"
    t.string "command_stdout"
    t.text "command_error"
    t.string "command_status"
    t.bigint "sample_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "job_status"
    t.text "job_description"
    t.string "job_log_id"
    t.string "postprocess_status"
    t.integer "finalized", default: 0, null: false
    t.bigint "total_reads"
    t.bigint "adjusted_remaining_reads"
    t.bigint "unmapped_reads"
    t.text "version"
    t.integer "subsample"
    t.string "pipeline_branch"
    t.integer "ready_step"
    t.integer "total_ercc_reads"
    t.float "fraction_subsampled", limit: 24
    t.string "pipeline_version"
    t.string "pipeline_commit"
    t.text "assembled_taxids"
    t.bigint "truncated"
    t.text "result_status"
    t.integer "results_finalized"
    t.bigint "alignment_config_id"
    t.integer "alert_sent", default: 0
    t.index ["job_status"], name: "index_pipeline_runs_on_job_status"
    t.index ["sample_id"], name: "index_pipeline_runs_on_sample_id"
  end

  create_table "projects", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "public_access", limit: 1
    t.integer "days_to_keep_sample_private", default: 365, null: false
    t.integer "background_flag", limit: 1, default: 0
    t.index ["name"], name: "index_projects_on_name", unique: true
  end

  create_table "projects_users", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "project_id", null: false
    t.bigint "user_id", null: false
    t.index ["project_id"], name: "index_projects_users_on_project_id"
    t.index ["user_id"], name: "index_projects_users_on_user_id"
  end

  create_table "samples", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "project_id"
    t.string "status"
    t.string "sample_unique_id"
    t.string "sample_location"
    t.string "sample_date"
    t.string "sample_tissue"
    t.string "sample_template"
    t.string "sample_library"
    t.string "sample_sequencer"
    t.text "sample_notes"
    t.text "s3_preload_result_path"
    t.text "s3_star_index_path"
    t.text "s3_bowtie2_index_path"
    t.integer "sample_memory"
    t.string "job_queue"
    t.bigint "host_genome_id"
    t.bigint "user_id"
    t.integer "subsample"
    t.string "pipeline_branch"
    t.float "sample_input_pg", limit: 24
    t.integer "sample_batch"
    t.text "sample_diagnosis"
    t.string "sample_organism"
    t.string "sample_detection"
    t.string "alignment_config_name"
    t.string "web_commit", default: ""
    t.string "pipeline_commit", default: ""
    t.index ["project_id", "name"], name: "index_samples_name_project_id", unique: true
    t.index ["user_id"], name: "index_samples_on_user_id"
  end

  create_table "taxon_byteranges", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "taxid"
    t.bigint "first_byte"
    t.bigint "last_byte"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "hit_type"
    t.integer "tax_level"
    t.bigint "pipeline_run_id"
    t.index ["pipeline_run_id", "taxid", "hit_type", "tax_level"], name: "index_pr_tax_ht_level_tb", unique: true
    t.index ["taxid"], name: "index_taxon_byteranges_on_taxid"
  end

  create_table "taxon_confirmations", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "taxid"
    t.integer "sample_id"
    t.integer "user_id"
    t.string "strength"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.index ["sample_id", "strength", "taxid"], name: "index_taxon_confirmations_on_sample_id_and_strength_and_taxid"
  end

  create_table "taxon_counts", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "tax_id"
    t.integer "tax_level"
    t.integer "count"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.string "count_type"
    t.float "percent_identity", limit: 24
    t.float "alignment_length", limit: 24
    t.float "e_value", limit: 24
    t.integer "genus_taxid", default: -200, null: false
    t.integer "superkingdom_taxid", default: -700, null: false
    t.float "percent_concordant", limit: 24
    t.float "species_total_concordant", limit: 24
    t.float "genus_total_concordant", limit: 24
    t.float "family_total_concordant", limit: 24
    t.bigint "pipeline_run_id"
    t.string "common_name"
    t.integer "family_taxid", default: -300, null: false
    t.integer "is_phage", limit: 1, default: 0, null: false
    t.index ["pipeline_run_id", "tax_id", "count_type", "tax_level"], name: "index_pr_tax_hit_level_tc", unique: true
  end

  create_table "taxon_descriptions", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "taxid", null: false
    t.bigint "wikipedia_id"
    t.string "title"
    t.text "summary"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["taxid"], name: "index_taxon_descriptions_on_taxid", unique: true
  end

  create_table "taxon_lineages", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "taxid", null: false
    t.integer "superkingdom_taxid", default: -700, null: false
    t.integer "phylum_taxid", default: -600, null: false
    t.integer "class_taxid", default: -500, null: false
    t.integer "order_taxid", default: -400, null: false
    t.integer "family_taxid", default: -300, null: false
    t.integer "genus_taxid", default: -200, null: false
    t.integer "species_taxid", default: -100, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "superkingdom_name", default: "", null: false
    t.string "phylum_name", default: "", null: false
    t.string "class_name", default: "", null: false
    t.string "order_name", default: "", null: false
    t.string "family_name", default: "", null: false
    t.string "genus_name", default: "", null: false
    t.string "species_name", default: "", null: false
    t.string "superkingdom_common_name", default: "", null: false
    t.string "phylum_common_name", default: "", null: false
    t.string "class_common_name", default: "", null: false
    t.string "order_common_name", default: "", null: false
    t.string "family_common_name", default: "", null: false
    t.string "genus_common_name", default: "", null: false
    t.string "species_common_name", default: "", null: false
    t.datetime "started_at", default: "2000-01-01 00:00:00", null: false
    t.datetime "ended_at", default: "3000-01-01 00:00:00", null: false
    t.integer "kingdom_taxid", default: -650, null: false
    t.string "kingdom_name", default: "", null: false
    t.string "kingdom_common_name", default: "", null: false
    t.index ["class_taxid"], name: "index_taxon_lineages_on_class_taxid"
    t.index ["family_taxid"], name: "index_taxon_lineages_on_family_taxid"
    t.index ["genus_taxid", "genus_name"], name: "index_taxon_lineages_on_genus_taxid_and_genus_name"
    t.index ["order_taxid"], name: "index_taxon_lineages_on_order_taxid"
    t.index ["phylum_taxid"], name: "index_taxon_lineages_on_phylum_taxid"
    t.index ["species_taxid"], name: "index_taxon_lineages_on_species_taxid"
    t.index ["superkingdom_taxid"], name: "index_taxon_lineages_on_superkingdom_taxid"
    t.index ["taxid", "ended_at"], name: "index_taxon_lineages_on_taxid_and_end", unique: true
    t.index ["taxid", "started_at", "ended_at"], name: "index_taxon_lineages_on_taxid_and_started_at_and_ended_at"
    t.index ["taxid", "started_at"], name: "index_taxon_lineages_on_taxid_and_start", unique: true
  end

  create_table "taxon_scoring_models", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "name"
    t.text "model_json"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "model_type"
    t.bigint "user_id"
    t.index ["name"], name: "index_taxon_scoring_models_on_name", unique: true
  end

  create_table "taxon_summaries", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.bigint "background_id"
    t.integer "tax_id"
    t.string "count_type"
    t.integer "tax_level"
    t.string "name"
    t.float "mean", limit: 24
    t.float "stdev", limit: 24
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "rpm_list"
    t.index ["background_id", "tax_id", "count_type", "tax_level"], name: "index_bg_tax_ct_level", unique: true
  end

  create_table "ui_configs", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.float "min_nt_z", limit: 24
    t.float "min_nr_z", limit: 24
    t.integer "min_nt_rpm"
    t.integer "min_nr_rpm"
    t.integer "top_n"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "email", default: "", null: false
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "authentication_token", limit: 30
    t.integer "role"
    t.text "allowed_features"
    t.index ["authentication_token"], name: "index_users_on_authentication_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end
end
