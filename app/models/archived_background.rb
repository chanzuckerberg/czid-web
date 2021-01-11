class ArchivedBackground < ApplicationRecord
  validates :archive_of, presence: true
  validates :data, presence: true
  validates :s3_backup_path, presence: true
end
