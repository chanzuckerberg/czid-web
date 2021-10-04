class Pathogen < ApplicationRecord
  has_and_belongs_to_many :pathogen_list_version
  has_one :citation, dependent: :nullify
end
