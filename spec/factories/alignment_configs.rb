FactoryBot.define do
  factory :alignment_config, class: AlignmentConfig do
    sequence(:name) { |n| "alignment-config-#{n}" }
    s3_nt_db_path { "s3://s3_nt_db_path" }
    s3_nt_loc_db_path { "s3://s3_nt_loc_db_path" }
    s3_nr_db_path { "s3://s3_nr_db_path" }
    s3_nr_loc_db_path { "s3://s3_nr_loc_db_path" }
    s3_lineage_path { "s3://s3_lineage_path" }
    s3_accession2taxid_path { "s3://s3_accession2taxid_path" }
    s3_deuterostome_db_path { "s3://s3_deuterostome_db_path" }
    lineage_version { 1 }
  end
end
