# Stores the persisted background for a users project.
# When a user selects a background in a sample report, it is persisted for the project that sample belongs to
# and will be loaded for every sample report for that particular project by default.

class PersistedBackground < ApplicationRecord
  belongs_to :user
  belongs_to :project
  belongs_to :background

  validates :user_id, presence: true
  validates :project_id, presence: true
  validates :background_id, presence: true
end
