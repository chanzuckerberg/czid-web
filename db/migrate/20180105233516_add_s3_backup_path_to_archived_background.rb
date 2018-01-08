class AddS3BackupPathToArchivedBackground < ActiveRecord::Migration[5.1]
  def change
    add_column :archived_backgrounds, :s3_backup_path, :string
  end
end
