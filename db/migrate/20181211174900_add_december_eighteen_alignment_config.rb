class AddDecemberEighteenAlignmentConfig < ActiveRecord::Migration[5.1]
  def change
    name = "2018-12-01"
    AlignmentConfig.create(
      name: name,
      lineage_version: 3,
      index_dir_suffix: name,
      s3_nt_db_path: "s3://idseq-database/alignment_data/#{name}/nt",
      s3_nt_loc_db_path: "s3://idseq-database/alignment_data/#{name}/nt_loc.db",
      s3_nr_db_path: "s3://idseq-database/alignment_data/#{name}/nr",
      s3_nr_loc_db_path: "s3://idseq-database/alignment_data/#{name}/nr_loc.db",
      s3_lineage_path: "s3://idseq-database/taxonomy/#{name}/taxid-lineages.db",
      s3_accession2taxid_path: "s3://idseq-database/alignment_data/#{name}/accession2taxid.db",
      s3_deuterostome_db_path: "s3://idseq-database/taxonomy/#{name}/deuterostome_taxids.txt"
    )
  end
end
