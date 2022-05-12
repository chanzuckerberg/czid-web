FactoryBot.define do
  factory :alignment_config, class: AlignmentConfig do
    sequence(:name) { |n| Date.new(2022, 1, 1).next_day(n).strftime("%Y-%m-%d") }
    s3_nt_db_path { "s3://s3_nt_db_path" }
    s3_nt_loc_db_path { "s3://s3_nt_loc_db_path" }
    s3_nr_db_path { "s3://s3_nr_db_path" }
    s3_nr_loc_db_path { "s3://s3_nr_loc_db_path" }
    s3_lineage_path { "s3://s3_lineage_path" }
    s3_accession2taxid_path { "s3://s3_accession2taxid_path" }
    s3_deuterostome_db_path { "s3://s3_deuterostome_db_path" }
    lineage_version { "2022-01-01" }
  end
end
