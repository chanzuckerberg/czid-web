# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2024_12_19_001315) do
  create_table "accession_coverage_stats", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pipeline_run_id", null: false, comment: "The id of the pipeline run the coverage stats were generated from"
    t.string "accession_id", null: false, comment: "The NCBI GenBank id of the accession the coverage stats were created for"
    t.text "accession_name", null: false, comment: "The NCBI GenBank name of the accession the coverage stats were created for"
    t.integer "taxid", null: false, comment: "The id of the taxon the accession belongs to"
    t.integer "num_contigs", null: false, comment: "Number of contigs for which this accession was the best match"
    t.integer "num_reads", null: false, comment: "Number of reads for which this accession was the best match"
    t.integer "score", null: false, comment: "max_contig_length + total_contig_length + num_reads, used to score top accessions"
    t.float "coverage_breadth", null: false, comment: "The percentage of the accession that is covered by at least one read or contig"
    t.float "coverage_depth", null: false, comment: "The average read depth of aligned contigs and reads over the length of the accession"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pipeline_run_id", "accession_id"], name: "index_accession_coverage_stats_on_pr_id_and_accession_id"
  end

  create_table "alignment_configs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.string "index_dir_suffix"
    t.text "s3_nt_db_path"
    t.text "s3_nt_loc_db_path"
    t.text "s3_nr_db_path"
    t.text "s3_nr_loc_db_path"
    t.text "s3_lineage_path"
    t.text "s3_accession2taxid_path"
    t.text "s3_deuterostome_db_path"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "s3_nt_info_db_path"
    t.string "s3_taxon_blacklist_path", default: "s3://idseq-public-references/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxon_blacklist.txt", null: false
    t.integer "lineage_version_old", limit: 2
    t.string "lineage_version", limit: 10, null: false
    t.string "minimap2_long_db_path", comment: "The S3 path prefix to the minimap2 index for short reads"
    t.string "minimap2_short_db_path", comment: "The S3 path prefix to the minimap2 index for long reads"
    t.string "diamond_db_path", comment: "The S3 path prefix to the diamond index"
  end

  create_table "amr_counts", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "gene"
    t.string "allele"
    t.float "coverage"
    t.float "depth"
    t.bigint "pipeline_run_id"
    t.string "drug_family"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "annotation_gene"
    t.string "genbank_accession"
    t.integer "total_reads"
    t.float "rpm"
    t.float "dpm"
    t.index ["pipeline_run_id", "allele"], name: "index_amr_counts_on_pipeline_run_id_and_allele", unique: true
  end

  create_table "annotations", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pipeline_run_id", null: false, comment: "The pipeline run id associated with the annotated sample report."
    t.integer "tax_id", null: false, comment: "The id of the annotated taxon."
    t.integer "content", comment: "An enum describing the annotation content. Will be set to null if an existing annotation is cleared."
    t.bigint "creator_id", comment: "The id of the user that created the annotation."
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pipeline_run_id", "tax_id"], name: "index_annotations_on_pipeline_run_id_and_tax_id"
  end

  create_table "app_configs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "key"
    t.text "value"
    t.index ["key"], name: "index_app_configs_on_key", unique: true
  end

  create_table "backgrounds", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "description"
    t.integer "public_access", limit: 1
    t.integer "ready", limit: 1, default: 0
    t.bigint "user_id"
    t.boolean "mass_normalized", default: false, null: false
    t.index ["name"], name: "index_backgrounds_on_name", unique: true
  end

  create_table "backgrounds_pipeline_runs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "background_id"
    t.bigint "pipeline_run_id"
    t.index ["background_id", "pipeline_run_id"], name: "index_bg_pr_id", unique: true
    t.index ["pipeline_run_id"], name: "backgrounds_pipeline_runs_pipeline_run_id_fk"
  end

  create_table "bulk_downloads", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.text "params_json", comment: "JSON of the params for this bulk download"
    t.string "download_type", null: false, comment: "The type of bulk download"
    t.string "status", null: false, comment: "The current status of the download, e.g. waiting, running, error, success"
    t.string "error_message", comment: "An error message to display to the user."
    t.bigint "user_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "access_token"
    t.float "progress"
    t.string "ecs_task_arn", comment: "The ecs task arn for this bulk download if applicable"
    t.bigint "output_file_size", comment: "The file size of the generated output file. Can be nil while the file is being generated."
    t.text "description"
    t.datetime "deleted_at", precision: nil, comment: "When the user triggered deletion of the bulk download"
    t.index ["user_id"], name: "index_bulk_downloads_on_user_id"
  end

  create_table "bulk_downloads_pipeline_runs", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pipeline_run_id", null: false
    t.bigint "bulk_download_id", null: false
    t.index ["bulk_download_id"], name: "index_bulk_downloads_pipeline_runs_on_bulk_download_id"
    t.index ["pipeline_run_id"], name: "index_bulk_downloads_pipeline_runs_on_pipeline_run_id"
  end

  create_table "bulk_downloads_workflow_runs", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "bulk_download_id", null: false
    t.bigint "workflow_run_id", null: false
    t.index ["bulk_download_id"], name: "index_bulk_downloads_workflow_runs_on_bulk_download_id"
    t.index ["workflow_run_id"], name: "index_bulk_downloads_workflow_runs_on_workflow_run_id"
  end

  create_table "citations", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "key", null: false, comment: "Key used to identify the citation (ie. niaid_2020)."
    t.text "footnote", null: false, comment: "Use MLA footnote citation style."
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_citations_on_key", unique: true
  end

  create_table "citations_pathogen_list_versions", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "citation_id", null: false
    t.bigint "pathogen_list_version_id", null: false
    t.index ["citation_id"], name: "index_citation_pathogen_list_version_on_citation_id"
    t.index ["pathogen_list_version_id"], name: "index_citation_pathogen_list_version_on_pathogen_list_version_id"
  end

  create_table "contigs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pipeline_run_id"
    t.string "name"
    t.text "sequence", size: :long
    t.integer "read_count"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "lineage_json", size: :medium
    t.integer "species_taxid_nt"
    t.integer "species_taxid_nr"
    t.integer "genus_taxid_nt"
    t.integer "genus_taxid_nr"
    t.integer "species_taxid_merged_nt_nr"
    t.integer "genus_taxid_merged_nt_nr"
    t.integer "base_count", comment: "Number of bases in the contig"
    t.index ["pipeline_run_id", "base_count"], name: "index_contigs_on_pipeline_run_id_and_base_count"
    t.index ["pipeline_run_id", "genus_taxid_merged_nt_nr"], name: "index_contigs_on_pipeline_run_id_and_genus_taxid_merged_nt_nr"
    t.index ["pipeline_run_id", "genus_taxid_nr"], name: "index_contigs_on_pipeline_run_id_and_genus_taxid_nr"
    t.index ["pipeline_run_id", "genus_taxid_nt"], name: "index_contigs_on_pipeline_run_id_and_genus_taxid_nt"
    t.index ["pipeline_run_id", "name"], name: "index_contigs_on_pipeline_run_id_and_name", unique: true
    t.index ["pipeline_run_id", "read_count"], name: "index_contigs_on_pipeline_run_id_and_read_count"
    t.index ["pipeline_run_id", "species_taxid_merged_nt_nr"], name: "index_contigs_on_pipeline_run_id_and_species_taxid_merged_nt_nr"
    t.index ["pipeline_run_id", "species_taxid_nr"], name: "index_contigs_on_pipeline_run_id_and_species_taxid_nr"
    t.index ["pipeline_run_id", "species_taxid_nt"], name: "index_contigs_on_pipeline_run_id_and_species_taxid_nt"
  end

  create_table "data_migrations", primary_key: "version", id: :string, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
  end

  create_table "deletion_logs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "object_id", null: false, comment: "The id of the object that was deleted"
    t.bigint "user_id", null: false, comment: "The user id of the user who deleted the object"
    t.string "user_email", comment: "The email of the user who deleted the object"
    t.string "object_type", null: false, comment: "The type of object deleted, e.g. PipelineRun"
    t.datetime "soft_deleted_at", precision: nil, comment: "When the object was marked as soft deleted"
    t.datetime "hard_deleted_at", precision: nil, comment: "When the object was successfully hard deleted"
    t.string "metadata_json", limit: 1024, comment: "Generic JSON-string format for recording additional information about the object"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "ercc_counts", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pipeline_run_id"
    t.string "name"
    t.integer "count"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["pipeline_run_id", "name"], name: "index_ercc_counts_on_pipeline_run_id_and_name", unique: true
  end

  create_table "host_genomes", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name", null: false, comment: "Friendly name of host genome. May be common name or scientific name of species. Must be unique and start with a capital letter."
    t.string "s3_star_index_path", default: "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar", null: false, comment: "The path to the index file to be used in the pipeline by star for host filtering."
    t.string "s3_bowtie2_index_path", default: "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar", null: false, comment: "The path to the index file to be used in the pipeline by bowtie for host filtering."
    t.bigint "default_background_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "skip_deutero_filter", default: 0, null: false, comment: "See https://en.wikipedia.org/wiki/Deuterostome. This affects the pipeline."
    t.string "taxa_category", default: "unknown", comment: "An informal taxa name for grouping hosts. First implemented for sample type suggestions."
    t.integer "samples_count", default: 0, null: false, comment: "Added to enable ranking of host genomes by popularity"
    t.bigint "user_id", comment: "The user that created the host genome. Values previous to 2020-02 may be NULL."
    t.string "s3_minimap2_dna_index_path", comment: "The path to the index file to be used in the pipeline by minimap2 for host filtering DNA samples"
    t.string "s3_minimap2_rna_index_path", comment: "The path to the index file to be used in the pipeline by minimap2 for host filtering RNA samples"
    t.string "s3_hisat2_index_path", default: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar", comment: "The path to the index file to be used in the pipeline by hisat2 for host filtering."
    t.string "s3_kallisto_index_path", default: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx", comment: "The path to the index file to be used in the pipeline by kallisto for host filtering."
    t.string "s3_bowtie2_index_path_v2", default: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar", comment: "The path to the index file to be used in the pipeline by bowtie2 for host filtering."
    t.string "s3_original_transcripts_gtf_index_path", comment: "The path to the index file to be used in the pipeline by kallisto for host filtering. Used to generate host gene counts"
    t.string "deprecation_status", comment: "Non-deprecated HostGenomes must be NULL. If deprecated, provide a brief message about deprecation, eg, 'deprecated on Nov 29 2023'."
    t.integer "version", default: 1, null: false, comment: "Version of this host's genome data, 1-indexed. Allows us to track multiple revisions of a certain host organism. Still, most hosts only have one version."
    t.index ["name", "version"], name: "index_host_genomes_on_name_and_version", unique: true
    t.index ["user_id"], name: "index_host_genomes_on_user_id"
  end

  create_table "host_genomes_metadata_fields", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "host_genome_id", null: false
    t.bigint "metadata_field_id", null: false
    t.index ["host_genome_id", "metadata_field_id"], name: "index_host_genomes_metadata_fields", unique: true
    t.index ["metadata_field_id", "host_genome_id"], name: "index_metadata_fields_host_genomes", unique: true
  end

  create_table "input_files", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.text "presigned_url"
    t.bigint "sample_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "source_type"
    t.text "source"
    t.text "parts"
    t.string "upload_client"
    t.string "file_type", comment: "Type of input file (e.g. sample FASTQ, primer bed file, etc.)"
    t.index ["sample_id"], name: "index_input_files_on_sample_id"
  end

  create_table "insert_size_metric_sets", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pipeline_run_id", null: false
    t.integer "median", null: false
    t.integer "mode", null: false
    t.integer "median_absolute_deviation", null: false
    t.integer "min", null: false
    t.integer "max", null: false
    t.float "mean", null: false
    t.float "standard_deviation", null: false
    t.integer "read_pairs", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["mean"], name: "index_insert_size_metric_sets_on_mean"
    t.index ["pipeline_run_id"], name: "index_insert_size_metric_sets_on_pipeline_run_id"
  end

  create_table "job_stats", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "task"
    t.integer "reads_after"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.bigint "pipeline_run_id"
    t.bigint "bases_after"
    t.index ["pipeline_run_id"], name: "index_job_stats_on_pipeline_run_id"
    t.index ["task"], name: "index_job_stats_on_task"
  end

  create_table "locations", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name", default: "", null: false, comment: "Full display name, such as a complete address"
    t.string "geo_level", limit: 20, default: "", null: false, comment: "Level of specificity (country, state, subdivision, or city)"
    t.string "country_name", limit: 100, default: "", null: false, comment: "Country (or equivalent) of this location if available"
    t.string "country_code", limit: 5, default: "", null: false, comment: "ISO 3166 alpha-2 country codes. Can be used to resolve country_name if data sources ever change."
    t.string "state_name", limit: 100, default: "", null: false, comment: "State (or equivalent) of this location if available"
    t.string "subdivision_name", limit: 100, default: "", null: false, comment: "Second-level administrative division (e.g. county/district/division/province/etc.) of this location if available"
    t.string "city_name", limit: 100, default: "", null: false, comment: "City (or equivalent) of this location if available"
    t.bigint "osm_id", comment: "OpenStreetMap ID for traceability. May change at any time."
    t.bigint "locationiq_id", comment: "Data provider API ID for traceability."
    t.decimal "lat", precision: 10, scale: 6, comment: "The latitude of this location if available"
    t.decimal "lng", precision: 10, scale: 6, comment: "The longitude of this location if available"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "osm_type", limit: 10, default: "", null: false, comment: "OpenStreetMap type (Node, Way, or Relation) to use OSM ID"
    t.integer "country_id", comment: "ID of the country entry in our database"
    t.integer "state_id", comment: "ID of the state entry in our database"
    t.integer "subdivision_id", comment: "ID of the subdivision entry in our database"
    t.integer "city_id", comment: "ID of the city entry in our database"
    t.index ["country_name", "state_name", "subdivision_name", "city_name"], name: "index_locations_levels", comment: "Index for lookup within regions. Composite works for any left subset of columns."
    t.index ["geo_level"], name: "index_locations_on_geo_level", comment: "Index for lookup by level of specificity"
    t.index ["name", "geo_level", "country_name", "state_name", "subdivision_name", "city_name"], name: "index_locations_name_fields", comment: "Index for lookup by important fields for identifying places. Composite works for any left subset of columns."
    t.index ["name"], name: "index_locations_on_name", comment: "Index for lookup by location name"
    t.index ["osm_type", "osm_id"], name: "index_locations_on_osm_type_and_osm_id"
  end

  create_table "metadata", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "key", null: false, collation: "latin1_swedish_ci"
    t.string "raw_value"
    t.string "string_validated_value"
    t.decimal "number_validated_value", precision: 36, scale: 9
    t.bigint "sample_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.date "date_validated_value"
    t.bigint "metadata_field_id"
    t.bigint "location_id"
    t.index ["metadata_field_id"], name: "index_metadata_on_metadata_field_id"
    t.index ["number_validated_value"], name: "index_metadata_on_number_validated_value"
    t.index ["sample_id", "key"], name: "index_metadata_on_sample_id_and_key", unique: true
    t.index ["string_validated_value"], name: "index_metadata_on_string_validated_value"
  end

  create_table "metadata_fields", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "display_name"
    t.string "description"
    t.integer "base_type", limit: 1, null: false
    t.string "options"
    t.integer "force_options", limit: 1, default: 0
    t.integer "is_core", limit: 1, default: 0
    t.integer "is_default", limit: 1, default: 0
    t.integer "is_required", limit: 1, default: 0
    t.string "group"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "examples"
    t.integer "default_for_new_host_genome", limit: 1, default: 0
    t.index ["group"], name: "index_metadata_fields_on_group"
  end

  create_table "metadata_fields_projects", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "metadata_field_id", null: false
    t.index ["metadata_field_id"], name: "metadata_fields_projects_metadata_field_id_fk"
    t.index ["project_id", "metadata_field_id"], name: "index_projects_metadata_fields", unique: true
  end

  create_table "nextgen_deletion_logs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "user_id", null: false, comment: "The user id of the user who deleted the object"
    t.string "user_email", comment: "The email of the user who deleted the object"
    t.bigint "rails_object_id", comment: "The id of the object that was deleted (Rails ID)"
    t.string "object_id", null: false, comment: "The id of the object that was deleted (NextGen UUID)"
    t.string "object_type", null: false, comment: "The type of object deleted, e.g. Sample, Workflow"
    t.datetime "soft_deleted_at", precision: nil, comment: "When the object was marked as soft deleted"
    t.datetime "hard_deleted_at", precision: nil, comment: "When the object was successfully hard deleted"
    t.string "metadata_json", comment: "Generic JSON-string format for recording additional information about the object"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "output_states", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "output"
    t.string "state"
    t.bigint "pipeline_run_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["pipeline_run_id", "output"], name: "index_output_states_on_pipeline_run_id_and_output", unique: true
  end

  create_table "pathogen_list_versions", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pathogen_list_id"
    t.string "version", null: false, comment: "Use semantic versioning numbers."
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pathogen_list_id"], name: "index_pathogen_list_versions_on_pathogen_list_id"
  end

  create_table "pathogen_list_versions_pathogens", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "pathogen_id", null: false
    t.bigint "pathogen_list_version_id", null: false
    t.index ["pathogen_id"], name: "index_pathogen_pathogen_list_version_on_pathogen_id"
    t.index ["pathogen_list_version_id"], name: "index_pathogen_pathogen_list_version_on_pathogen_list_version_id"
  end

  create_table "pathogen_lists", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "creator_id", comment: "The user_id that created the pathogen list. Null if the list is admin-managed."
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_global", default: false, null: false
  end

  create_table "pathogens", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "tax_id", null: false, comment: "The taxon id of the pathogen."
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "citation_id"
    t.index ["citation_id"], name: "index_pathogens_on_citation_id"
  end

  create_table "persisted_backgrounds", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "user_id", null: false, comment: "The id of the user that has the persisted_background"
    t.bigint "project_id", null: false, comment: "The id of the project that the persisted background is persisted for"
    t.bigint "background_id", comment: "The id of the background that is being persisted. Will be set to null if the user selects a background with an incompatible sample."
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "project_id"], name: "index_user_id_project_id", unique: true
  end

  create_table "phylo_tree_ngs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.json "inputs_json", comment: "Generic JSON field for recording execution inputs."
    t.string "status", default: "CREATED", null: false, comment: "A soft enum (string) describing the execution status."
    t.string "wdl_version", comment: "Version of the WDL used in execution."
    t.string "sfn_execution_arn", comment: "Step Function execution ARN."
    t.string "s3_output_prefix", comment: "Record the SFN-WDL OutputPrefix used. Ex: 's3://bucket/phylo_trees/subpath/results' Never allow users to set this."
    t.datetime "executed_at", precision: nil, comment: "Self-managed field to track the time of kickoff and dispatch."
    t.boolean "deprecated", default: false, null: false, comment: "If true, don't surface the run to the user."
    t.bigint "rerun_from", comment: "Id of the phylo tree this was rerun from, if applicable"
    t.string "name", null: false, comment: "Name of the NG phylo tree"
    t.virtual "tax_id", type: :integer, comment: "Taxon id of interest", as: "json_unquote(json_extract(`inputs_json`,'$.tax_id'))"
    t.bigint "user_id", null: false
    t.bigint "project_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.datetime "deleted_at", precision: nil, comment: "When the user triggered deletion of the phylo tree"
    t.index ["name"], name: "index_phylo_tree_ngs_on_name"
    t.index ["project_id", "tax_id"], name: "index_phylo_tree_ngs_on_project_id_and_tax_id"
    t.index ["user_id"], name: "index_phylo_tree_ngs_on_user_id"
  end

  create_table "phylo_tree_ngs_pipeline_runs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "phylo_tree_ng_id"
    t.bigint "pipeline_run_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["phylo_tree_ng_id", "pipeline_run_id"], name: "index_ptng_pr_id", unique: true
  end

  create_table "phylo_trees", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "taxid"
    t.integer "tax_level"
    t.string "tax_name"
    t.bigint "user_id"
    t.bigint "project_id"
    t.text "newick"
    t.integer "status", default: 0
    t.string "dag_version"
    t.text "dag_json", size: :long
    t.text "command_stdout"
    t.text "command_stderr"
    t.string "job_id"
    t.string "job_log_id"
    t.text "job_description"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "name"
    t.string "dag_branch"
    t.text "ncbi_metadata"
    t.string "snp_annotations"
    t.datetime "ready_at", precision: nil
    t.string "vcf"
    t.text "dag_vars"
    t.datetime "deleted_at", precision: nil, comment: "When the user triggered deletion of the phylo tree"
    t.index ["name"], name: "index_phylo_trees_on_name", unique: true
    t.index ["project_id", "taxid"], name: "index_phylo_trees_on_project_id_and_taxid"
    t.index ["user_id"], name: "index_phylo_trees_on_user_id"
  end

  create_table "phylo_trees_pipeline_runs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "phylo_tree_id"
    t.bigint "pipeline_run_id"
    t.index ["phylo_tree_id", "pipeline_run_id"], name: "index_pt_pr_id", unique: true
    t.index ["pipeline_run_id"], name: "phylo_trees_pipeline_runs_pipeline_run_id_fk"
  end

  create_table "pipeline_run_stages", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
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
    t.float "job_progress_pct"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "job_command_func"
    t.string "load_db_command_func"
    t.string "job_id"
    t.string "output_func"
    t.string "name"
    t.text "failed_jobs"
    t.text "dag_json"
    t.datetime "executed_at", precision: nil, comment: "When the pipeline run stage was actually dispatched for processing."
    t.integer "time_to_finalized", comment: "Seconds from executed_at to marked as finished with processing."
    t.index ["pipeline_run_id", "step_number"], name: "index_pipeline_run_stages_on_pipeline_run_id_and_step_number"
  end

  create_table "pipeline_runs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "sample_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "job_status"
    t.integer "finalized", default: 0, null: false
    t.bigint "total_reads"
    t.bigint "adjusted_remaining_reads"
    t.bigint "unmapped_reads"
    t.integer "subsample"
    t.string "pipeline_branch"
    t.integer "total_ercc_reads"
    t.float "fraction_subsampled"
    t.string "pipeline_version"
    t.string "pipeline_commit"
    t.bigint "truncated"
    t.integer "results_finalized"
    t.bigint "alignment_config_id"
    t.integer "alert_sent", default: 0
    t.text "dag_vars"
    t.integer "assembled", limit: 2
    t.integer "max_input_fragments"
    t.text "error_message"
    t.string "known_user_error"
    t.string "pipeline_execution_strategy", default: "step_function", comment: "A soft enum (string) describing which pipeline infrastructure the pipeline run was performed on."
    t.string "sfn_execution_arn", comment: "step function execution ARN for pipeline runs using pipeline_execution_strategy=step_function"
    t.boolean "use_taxon_whitelist", default: false, null: false, comment: "If true, pipeline processing will filter for a whitelist of taxons."
    t.string "wdl_version"
    t.string "s3_output_prefix", comment: "Record the SFN-WDL OutputPrefix used. Ex: 's3://bucket/samples/subpath/results' Never allow users to set this."
    t.datetime "executed_at", precision: nil, comment: "When the pipeline run was actually dispatched for processing."
    t.integer "time_to_finalized", comment: "Seconds from executed_at to marked as finished with processing, not including results loading."
    t.integer "time_to_results_finalized", comment: "Seconds from executed_at to marked as finished with processing and results loading."
    t.float "qc_percent"
    t.float "compression_ratio"
    t.boolean "deprecated", default: false, comment: "True/false if the pipeline run has been deprecated or not. Non deprecated pipeline runs are used in the normal flow of the web app."
    t.string "technology", default: "Illumina", null: false, comment: "Name of the technology used, e.g. illumina or ont."
    t.string "guppy_basecaller_setting", comment: "User-specified input used by ont pipeline runs. Null for illumina pipeline runs."
    t.bigint "total_bases"
    t.bigint "unmapped_bases"
    t.float "fraction_subsampled_bases"
    t.bigint "truncated_bases"
    t.datetime "deleted_at", precision: nil, comment: "When the user triggered deletion of the pipeline run"
    t.bigint "mapped_reads"
    t.index ["adjusted_remaining_reads"], name: "index_pipeline_runs_on_adjusted_remaining_reads"
    t.index ["alignment_config_id"], name: "pipeline_runs_alignment_config_id_fk"
    t.index ["compression_ratio"], name: "index_pipeline_runs_on_compression_ratio"
    t.index ["fraction_subsampled"], name: "index_pipeline_runs_on_fraction_subsampled"
    t.index ["fraction_subsampled_bases"], name: "index_pipeline_runs_on_fraction_subsampled_bases"
    t.index ["job_status"], name: "index_pipeline_runs_on_job_status"
    t.index ["pipeline_version"], name: "index_pipeline_runs_on_pipeline_version"
    t.index ["qc_percent"], name: "index_pipeline_runs_on_qc_percent"
    t.index ["sample_id"], name: "index_pipeline_runs_on_sample_id"
    t.index ["technology"], name: "index_pipeline_runs_on_technology"
    t.index ["time_to_finalized"], name: "index_pipeline_runs_on_time_to_finalized"
    t.index ["total_bases"], name: "index_pipeline_runs_on_total_bases"
    t.index ["total_ercc_reads"], name: "index_pipeline_runs_on_total_ercc_reads"
    t.index ["total_reads"], name: "index_pipeline_runs_on_total_reads"
  end

  create_table "project_workflow_versions", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "project_id", null: false, comment: "The project to which this workflow version applies"
    t.string "workflow", null: false, comment: "The workflow to which this version applies"
    t.string "version_prefix", null: false, comment: "The version prefix that will be used to run the workflow - can be major, patch, or minor"
    t.index ["project_id", "workflow"], name: "index_project_workflow_versions_on_project_id_and_workflow", unique: true
  end

  create_table "projects", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "public_access", limit: 1, default: 0
    t.integer "days_to_keep_sample_private", default: 100000, null: false
    t.integer "background_flag", limit: 1, default: 0
    t.text "description"
    t.integer "subsample_default", comment: "The default value of subsample for newly uploaded samples. Can be overridden by admin options."
    t.integer "max_input_fragments_default", comment: "The default value of max_input_fragments for newly uploaded samples. Can be overridden by admin options."
    t.bigint "creator_id", comment: "The user_id that created the project."
    t.index ["created_at"], name: "index_projects_on_created_at"
    t.index ["name"], name: "index_projects_on_name", unique: true
  end

  create_table "projects_users", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "user_id", null: false
    t.index ["project_id"], name: "index_projects_users_on_project_id"
    t.index ["user_id"], name: "index_projects_users_on_user_id"
  end

  create_table "sample_types", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name", null: false, comment: "Canonical name of the sample type. This should be immutable after creation. It is used as a key to join with MetadataField sample_type values."
    t.string "group", null: false, comment: "Mutually exclusive grouping of names. Example: \"Organs\"."
    t.boolean "insect_only", default: false, null: false, comment: "Whether a sample type should only be for insects."
    t.boolean "human_only", default: false, null: false, comment: "Whether a sample type should only be for humans."
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["name"], name: "index_sample_types_on_name", unique: true
  end

  create_table "samples", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.bigint "project_id"
    t.string "status"
    t.text "sample_notes"
    t.text "s3_preload_result_path"
    t.text "s3_star_index_path"
    t.text "s3_bowtie2_index_path"
    t.bigint "host_genome_id"
    t.bigint "user_id"
    t.integer "subsample"
    t.string "pipeline_branch"
    t.string "alignment_config_name"
    t.string "web_commit", default: ""
    t.string "pipeline_commit", default: ""
    t.text "dag_vars"
    t.integer "max_input_fragments"
    t.datetime "client_updated_at", precision: nil, comment: "Deprecated as of 2021-02-09."
    t.integer "uploaded_from_basespace", limit: 1, default: 0
    t.string "upload_error"
    t.string "basespace_access_token"
    t.boolean "do_not_process", default: false, null: false, comment: "If true, sample will skip pipeline processing."
    t.string "pipeline_execution_strategy", comment: "A soft enum (string) describing which pipeline infrastructure to run the sample on."
    t.boolean "use_taxon_whitelist", default: false, null: false, comment: "If true, sample processing will filter for a whitelist of taxons."
    t.string "initial_workflow", default: "short-read-mngs", null: false, comment: "A soft enum (string) describing the initial workflow the sample was run on"
    t.datetime "deleted_at", precision: nil, comment: "When the user triggered deletion of the sample"
    t.index ["created_at"], name: "index_samples_on_created_at"
    t.index ["host_genome_id"], name: "samples_host_genome_id_fk"
    t.index ["name"], name: "index_samples_on_name"
    t.index ["project_id", "name"], name: "index_samples_name_project_id", unique: true
    t.index ["user_id"], name: "index_samples_on_user_id"
  end

  create_table "samples_visualizations", id: false, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "visualization_id", null: false
    t.bigint "sample_id", null: false
    t.index ["sample_id"], name: "index_samples_visualizations_on_sample_id"
    t.index ["visualization_id"], name: "index_samples_visualizations_on_visualization_id"
  end

  create_table "seed_migrations", id: :integer, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "version"
    t.integer "runtime"
    t.datetime "migrated_on", precision: nil
  end

  create_table "shortened_urls", id: :integer, charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "owner_id"
    t.string "owner_type", limit: 20
    t.text "url", null: false
    t.string "unique_key", limit: 10, null: false
    t.string "category"
    t.integer "use_count", default: 0, null: false
    t.datetime "expires_at", precision: nil
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.index ["category"], name: "index_shortened_urls_on_category"
    t.index ["owner_id", "owner_type"], name: "index_shortened_urls_on_owner_id_and_owner_type"
    t.index ["unique_key"], name: "index_shortened_urls_on_unique_key", unique: true
    t.index ["url"], name: "index_shortened_urls_on_url", length: 254
  end

  create_table "snapshot_links", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "project_id"
    t.text "content", null: false, comment: "Content stored as {samples: [<sample_id>: {pipeline_run_id: <pipeline_run_id>}]}"
    t.string "share_id", limit: 20, null: false, comment: "Used for accessing the SnapshotLink URL"
    t.bigint "creator_id", comment: "The user_id that created the snapshot."
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["project_id"], name: "index_snapshot_links_on_project_id"
    t.index ["share_id"], name: "index_snapshot_links_on_share_id", unique: true
  end

  create_table "taxon_byteranges", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "taxid"
    t.bigint "first_byte"
    t.bigint "last_byte"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "hit_type"
    t.bigint "pipeline_run_id"
    t.index ["pipeline_run_id", "taxid", "hit_type"], name: "index_pr_tax_ht_level_tb", unique: true
    t.index ["taxid"], name: "index_taxon_byteranges_on_taxid"
  end

  create_table "taxon_counts", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "tax_id"
    t.integer "tax_level"
    t.integer "count"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "name"
    t.string "count_type"
    t.float "percent_identity"
    t.float "alignment_length"
    t.float "e_value"
    t.integer "genus_taxid", default: -200, null: false
    t.integer "superkingdom_taxid", default: -700, null: false
    t.bigint "pipeline_run_id"
    t.string "common_name"
    t.integer "family_taxid", default: -300, null: false
    t.integer "is_phage", limit: 1, default: 0, null: false
    t.string "source_count_type", comment: "The count type which the merged_nt_nr value is derived from"
    t.float "rpm", comment: "Number of reads aligning to the taxon in the NCBI NR/NT database, per million reads sequenced."
    t.decimal "percent_identity_decimal", precision: 9, scale: 2
    t.decimal "alignment_length_decimal", precision: 9, scale: 2
    t.decimal "rpm_decimal", precision: 9, scale: 2
    t.bigint "base_count", comment: "Number of bases aligning to the taxon in the NCBI NR/NT database"
    t.float "bpm", comment: "Number of bases aligning to the taxon in the NCBI NR/NT database, per million bases sequenced"
    t.index ["pipeline_run_id", "tax_id", "count_type", "tax_level"], name: "index_pr_tax_hit_level_tc", unique: true
    t.index ["tax_id"], name: "index_taxon_counts_on_tax_id"
  end

  create_table "taxon_descriptions", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "taxid", null: false
    t.bigint "wikipedia_id"
    t.string "title"
    t.text "summary", size: :medium
    t.text "description", size: :medium
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["taxid"], name: "index_taxon_descriptions_on_taxid", unique: true
  end

  create_table "taxon_lineages", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "taxid", null: false
    t.integer "superkingdom_taxid", default: -700, null: false
    t.integer "phylum_taxid", default: -600, null: false
    t.integer "class_taxid", default: -500, null: false
    t.integer "order_taxid", default: -400, null: false
    t.integer "family_taxid", default: -300, null: false
    t.integer "genus_taxid", default: -200, null: false
    t.integer "species_taxid", default: -100, null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
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
    t.integer "kingdom_taxid", default: -650, null: false
    t.string "kingdom_name", default: "", null: false
    t.string "kingdom_common_name", default: "", null: false
    t.string "tax_name"
    t.boolean "is_phage", default: false, null: false
    t.string "version_start", limit: 10, null: false, comment: "The first version for which the lineage is valid"
    t.string "version_end", limit: 10, null: false, comment: "The last version for which the lineage is valid"
    t.index ["class_taxid"], name: "index_taxon_lineages_on_class_taxid"
    t.index ["family_taxid"], name: "index_taxon_lineages_on_family_taxid"
    t.index ["genus_taxid", "genus_name"], name: "index_taxon_lineages_on_genus_taxid_and_genus_name"
    t.index ["order_taxid"], name: "index_taxon_lineages_on_order_taxid"
    t.index ["phylum_taxid"], name: "index_taxon_lineages_on_phylum_taxid"
    t.index ["species_taxid"], name: "index_taxon_lineages_on_species_taxid"
    t.index ["superkingdom_taxid"], name: "index_taxon_lineages_on_superkingdom_taxid"
    t.index ["tax_name"], name: "index_taxon_lineages_on_tax_name"
    t.index ["taxid", "version_end"], name: "index_taxon_lineages_on_taxid_and_version_end", unique: true
    t.index ["taxid", "version_start", "version_end"], name: "index_taxon_lineages_on_taxid_and_version_start_and_version_end", unique: true
    t.index ["taxid", "version_start"], name: "index_taxon_lineages_on_taxid_and_version_start", unique: true
  end

  create_table "taxon_summaries", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "background_id"
    t.integer "tax_id"
    t.string "count_type"
    t.integer "tax_level"
    t.float "mean"
    t.float "stdev"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "rpm_list"
    t.float "mean_mass_normalized"
    t.float "stdev_mass_normalized"
    t.text "rel_abundance_list_mass_normalized"
    t.index ["background_id", "tax_id", "count_type", "tax_level"], name: "index_bg_tax_ct_level", unique: true
  end

  create_table "user_settings", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "user_id"
    t.string "key", comment: "The name of the user setting, e.g. receives_bulk_download_success_emails"
    t.string "serialized_value", comment: "The serialized value of the user setting. The schema of this value (e.g. boolean, number) is determined by the hard-coded data type associated with the key."
    t.index ["user_id", "key"], name: "index_user_settings_on_user_id_and_key", unique: true
    t.index ["user_id"], name: "index_user_settings_on_user_id"
  end

  create_table "users", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "email"
    t.string "name"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at", precision: nil
    t.datetime "last_sign_in_at", precision: nil
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.integer "role"
    t.text "allowed_features"
    t.string "institution", limit: 100
    t.integer "samples_count", default: 0, null: false
    t.integer "visualizations_count", default: 0, null: false
    t.integer "phylo_trees_count", default: 0, null: false
    t.bigint "created_by_user_id", comment: "The user_id that created/invited this user."
    t.text "archetypes"
    t.string "segments"
    t.string "salt", limit: 24
    t.integer "profile_form_version", default: 0, null: false, comment: "Version of completed user profile form, or 0 to denote missing profile form."
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "visualizations", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "user_id"
    t.string "visualization_type"
    t.text "data"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "public_access", limit: 1
    t.string "name"
    t.string "status", comment: "A soft enum (string) describing the execution status. Currently only applicable to phylo trees."
    t.index ["name"], name: "index_visualizations_on_name"
    t.index ["updated_at"], name: "index_visualizations_on_updated_at"
    t.index ["user_id"], name: "index_visualizations_on_user_id"
  end

  create_table "workflow_runs", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "sample_id"
    t.string "status", default: "CREATED", null: false, comment: "A soft enum (string) describing the execution status."
    t.string "workflow", null: false, comment: "Name of the workflow to use, e.g. consensus-genome."
    t.string "wdl_version", comment: "Version of the WDL used in execution."
    t.string "sfn_execution_arn", comment: "Step Function execution ARN."
    t.datetime "executed_at", precision: nil, comment: "Self-managed field to track the time of kickoff and dispatch."
    t.boolean "deprecated", default: false, null: false, comment: "If true, don't surface the run to the user."
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.bigint "rerun_from"
    t.text "cached_results", comment: "JSON-string of cached results for generic loading. Use for simple outputs."
    t.text "inputs_json", comment: "Generic JSON-string field for recording execution inputs."
    t.string "s3_output_prefix", comment: "Record the SFN-WDL OutputPrefix used. Ex: 's3://bucket/samples/subpath/results' Never allow users to set this."
    t.integer "time_to_finalized", comment: "Seconds from executed_at to marked as finished with processing."
    t.text "error_message"
    t.datetime "deleted_at", precision: nil, comment: "When the user triggered deletion of the workflow run"
    t.bigint "user_id", comment: "The ID of the user who kicked off the workflow run"
    t.json "temp_cg_coverage_viz", comment: "Temporary column to store coverage viz data for consensus-genome workflow runs"
    t.index ["created_at"], name: "index_workflow_runs_on_created_at"
    t.index ["sample_id"], name: "index_workflow_runs_on_sample_id"
  end

  create_table "workflow_versions", charset: "utf8", collation: "utf8_unicode_ci", force: :cascade do |t|
    t.string "workflow", null: false, comment: "Name of the workflow (e.g. short-read-mngs)"
    t.string "version", null: false, comment: "The specific version of the workflow (e.g. 1.2.3)"
    t.boolean "deprecated", comment: "A workflow version is deprecated if it's no longer receiving patches, but is runnable"
    t.boolean "runnable", comment: "A workflow version is runnable if the infrastructure can run it"
    t.index ["workflow", "version"], name: "index_workflow_versions_on_workflow_and_version", unique: true
  end

  add_foreign_key "amr_counts", "pipeline_runs", name: "amr_counts_pipeline_run_id_fk"
  add_foreign_key "backgrounds_pipeline_runs", "backgrounds", name: "backgrounds_pipeline_runs_background_id_fk"
  add_foreign_key "backgrounds_pipeline_runs", "pipeline_runs", name: "backgrounds_pipeline_runs_pipeline_run_id_fk"
  add_foreign_key "bulk_downloads", "users"
  add_foreign_key "bulk_downloads_pipeline_runs", "bulk_downloads", name: "bulk_downloads_pipeline_runs_bulk_download_id_fk"
  add_foreign_key "bulk_downloads_pipeline_runs", "pipeline_runs", name: "bulk_downloads_pipeline_runs_pipeline_run_id_fk"
  add_foreign_key "bulk_downloads_workflow_runs", "bulk_downloads", name: "bulk_downloads_workflow_runs_bulk_download_id_fk"
  add_foreign_key "bulk_downloads_workflow_runs", "workflow_runs", name: "bulk_downloads_workflow_runs_workflow_run_id_fk"
  add_foreign_key "host_genomes", "users"
  add_foreign_key "host_genomes_metadata_fields", "host_genomes", name: "host_genomes_metadata_fields_host_genome_id_fk"
  add_foreign_key "host_genomes_metadata_fields", "metadata_fields", name: "host_genomes_metadata_fields_metadata_field_id_fk"
  add_foreign_key "input_files", "samples", name: "input_files_sample_id_fk"
  add_foreign_key "job_stats", "pipeline_runs", name: "job_stats_pipeline_run_id_fk"
  add_foreign_key "metadata", "metadata_fields", name: "metadata_metadata_field_id_fk"
  add_foreign_key "metadata", "samples", name: "metadata_sample_id_fk"
  add_foreign_key "metadata_fields_projects", "metadata_fields", name: "metadata_fields_projects_metadata_field_id_fk"
  add_foreign_key "metadata_fields_projects", "projects", name: "metadata_fields_projects_project_id_fk"
  add_foreign_key "output_states", "pipeline_runs", name: "output_states_pipeline_run_id_fk"
  add_foreign_key "pathogen_list_versions", "pathogen_lists"
  add_foreign_key "pathogens", "citations"
  add_foreign_key "phylo_trees", "projects", name: "phylo_trees_project_id_fk"
  add_foreign_key "phylo_trees", "users", name: "phylo_trees_user_id_fk"
  add_foreign_key "phylo_trees_pipeline_runs", "phylo_trees", name: "phylo_trees_pipeline_runs_phylo_tree_id_fk"
  add_foreign_key "phylo_trees_pipeline_runs", "pipeline_runs", name: "phylo_trees_pipeline_runs_pipeline_run_id_fk"
  add_foreign_key "pipeline_run_stages", "pipeline_runs", name: "pipeline_run_stages_pipeline_run_id_fk"
  add_foreign_key "pipeline_runs", "alignment_configs", name: "pipeline_runs_alignment_config_id_fk"
  add_foreign_key "pipeline_runs", "samples", name: "pipeline_runs_sample_id_fk"
  add_foreign_key "projects_users", "projects", name: "projects_users_project_id_fk"
  add_foreign_key "projects_users", "users", name: "projects_users_user_id_fk"
  add_foreign_key "samples", "host_genomes", name: "samples_host_genome_id_fk"
  add_foreign_key "samples", "projects", name: "samples_project_id_fk"
  add_foreign_key "samples", "users", name: "samples_user_id_fk"
  add_foreign_key "samples_visualizations", "samples", name: "samples_visualizations_sample_id_fk"
  add_foreign_key "samples_visualizations", "visualizations", name: "samples_visualizations_visualization_id_fk"
  add_foreign_key "snapshot_links", "projects"
  add_foreign_key "user_settings", "users"
  add_foreign_key "visualizations", "users", name: "visualizations_user_id_fk"
end
