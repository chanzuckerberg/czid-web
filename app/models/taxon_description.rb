class TaxonDescription < ApplicationRecord
  has_many :taxon_child_parents, dependent: :destroy
  has_many :taxon_categories, dependent: :destroy
end
