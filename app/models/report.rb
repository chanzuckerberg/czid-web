class Report < ApplicationRecord
  belongs_to :pipeline_output
  has_many :taxon_zscores, dependent: :destroy
  accepts_nested_attributes_for :taxon_zscores
  belongs_to :background
end
