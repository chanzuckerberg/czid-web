class Project < ApplicationRecord
  has_and_belongs_to_many :users
  has_many :samples
  has_many :favorite_projects  
  has_many :favorited_by, through: :favorite_projects, source: :user 
  validates :name, presence: true, uniqueness: true
end
