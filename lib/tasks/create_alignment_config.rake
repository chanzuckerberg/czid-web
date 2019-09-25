desc 'Creates a new AlignmentConfig for a set of indexes'

task 'create_alignment_config' do
  name = env['NCBI_DATE'] # YYYY-MM-DD
  raise "Must have a NCBI_DATE" unless name

  lineage_version = env['LINEAGE_VERSION'] || AlignmentConfig.last.lineage_version

  AlignmentConfig.create(
    name: name,
    lineage_version: lineage_version,
    index_dir_suffix: name,
    s3_nt_db_path: "s3://idseq-database/alignment_data/#{name}/nt",
    s3_nt_loc_db_path: "s3://idseq-database/alignment_data/#{name}/nt_loc.sqlite3",
    s3_nr_db_path: "s3://idseq-database/alignment_data/#{name}/nr",
    s3_nr_loc_db_path: "s3://idseq-database/alignment_data/#{name}/nr_loc.sqlite3",
    s3_lineage_path: "s3://idseq-database/taxonomy/#{name}/taxid-lineages.sqlite3",
    s3_accession2taxid_path: "s3://idseq-database/alignment_data/#{name}/accession2taxid.sqlite3",
    s3_deuterostome_db_path: "s3://idseq-database/taxonomy/#{name}/deuterostome_taxids.txt"
  )
end
