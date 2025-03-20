class UserProfile < ApplicationRecord
  # Association - assuming a user model exists
  belongs_to :user

  # Validations
  validates :user_id, presence: true
  validates :profile_form_version, numericality: { only_integer: true }, allow_nil: true
  serialize :czid_usecase, Array
  serialize :referral_source, Array
end
