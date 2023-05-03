class Citation < ApplicationRecord
  validates :key, presence: true, uniqueness: { case_sensitive: false }
  has_and_belongs_to_many :pathogen_list_versions
end
