class ArchivedBackground < ApplicationRecord
  validates :archive_of, presence: true, if: :mass_validation_enabled?
  validates :data, presence: true, if: :mass_validation_enabled?
  validates :s3_backup_path, presence: true, if: :mass_validation_enabled?
end
