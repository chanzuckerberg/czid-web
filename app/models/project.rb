class Project < ApplicationRecord
  has_and_belongs_to_many :users
  has_many :samples
  validates :name, presence: true, uniqueness: true
end
