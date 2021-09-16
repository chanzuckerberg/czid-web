# Stores the persisted background for a users project.
# When a user selects a background in a sample report, it is persisted for the project that sample belongs to
# and will be loaded for every sample report for that particular project by default.

class UniquePersistedBackgroundValidator < ActiveModel::Validator
  def validate(record)
    if PersistedBackground.exists?(user_id: record.user_id, project_id: record.project_id)
      # Errors added to record.errors[:base] relate to the state of the record as a whole, and not to a specific attribute.
      record.errors.add :base, "User #{record.user_id} already has a background persisted for project #{record.project_id}"
    end
  end
end

# A user can only create/update persisted backgrounds when they have both read access to the project and background.
class PersistedBackgroundReadAccessValidator < ActiveModel::Validator
  def validate(record)
    if record.background_id.present? && Background.viewable(record.user).where(id: record.background_id).empty?
      # Errors added to record.errors[:base] relate to the state of the record as a whole, and not to a specific attribute.
      record.errors.add :base, "User #{record.user_id} does not have read access to Background #{record.background_id}"
    end

    if Project.viewable(record.user).where(id: record.project_id).empty?
      record.errors.add :base, "User #{record.user_id} does not have read access to Project #{record.project_id}"
    end
  end
end

class PersistedBackground < ApplicationRecord
  belongs_to :user
  belongs_to :project
  belongs_to :background, optional: true

  validates :user_id, presence: true
  validates :project_id, presence: true
  validates_with UniquePersistedBackgroundValidator, PersistedBackgroundReadAccessValidator, on: :create
  validates_with PersistedBackgroundReadAccessValidator, on: :update

  scope :viewable, ->(user) { where(user: user) }
end
