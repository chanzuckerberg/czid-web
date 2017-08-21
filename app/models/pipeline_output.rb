class PipelineOutput < ApplicationRecord
  belongs_to :sample
  has_many :taxon_counts, dependent: :destroy
  accepts_nested_attributes_for :taxon_counts
end
