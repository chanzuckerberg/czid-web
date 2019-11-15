class UpdateNtInfoToBerkeleyDb < ActiveRecord::Migration[5.1]
  def change
    AlignmentConfig.where(name: "2019-09-17").update_all(
      s3_nt_info_db_path: "s3://idseq-database/alignment_data/2019-09-17/nt_info.db",
    )
  end
end
