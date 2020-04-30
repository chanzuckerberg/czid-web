class AlignmentConfigToShelve < ActiveRecord::Migration[5.1]
  def up
    AlignmentConfig.all.each do |ac|
      if ac.s3_nt_info_db_path && ac.s3_nt_info_db_path.end_with?('.sqlite3')
        shelve_path = ac.s3_nt_info_db_path.sub!('.sqlite3', '.db')
        ac.update(s3_nt_info_db_path: shelve_path)
      end
    end
  end

  def down
    AlignmentConfig.all.each do |ac|
      if ac.s3_nt_info_db_path && ac.s3_nt_info_db_path.end_with?('.db')
        shelve_path = ac.s3_nt_info_db_path.sub!('.db', '.sqlite3')
        ac.update(s3_nt_info_db_path: shelve_path)
      end
    end
  end
end
