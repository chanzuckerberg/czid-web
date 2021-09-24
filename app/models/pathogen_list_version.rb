class PathogenListVersion < ApplicationRecord
  has_and_belongs_to_many :pathogen
  belongs_to :pathogen_list
end
