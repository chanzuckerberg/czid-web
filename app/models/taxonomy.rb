class Taxonomy < ApplicationRecord
  has_many :taxon_descriptions, dependent: :destroy
  accepts_nested_attributes_for :taxon_descriptions
end
