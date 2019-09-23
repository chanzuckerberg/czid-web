class PipelineConfigChangeSqliteToShelve < ActiveRecord::Migration[5.1]
  def change
    AlignmentConfig.where(name: "2018-12-01").update_all(
      s3_nt_loc_db_path: "s3://idseq-database/alignment_data/2018-12-01/nt_loc.db",
      s3_nr_loc_db_path: "s3://idseq-database/alignment_data/2018-12-01/nr_loc.db",
      s3_lineage_path: "s3://idseq-database/taxonomy/2018-12-01/taxid-lineages.db",
      s3_accession2taxid_path: "s3://idseq-database/alignment_data/2018-12-01/accession2taxid.db"
    )
  end
end
