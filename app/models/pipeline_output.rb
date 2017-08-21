class PipelineOutput < ApplicationRecord
  belongs_to :sample
  has_many :taxon_count, dependent: :destroy
end
