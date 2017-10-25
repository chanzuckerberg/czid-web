class SequenceLocator < ApplicationRecord
  belongs_to :postprocess_run
  belongs_to :pipeline_output
  has_many :taxon_sequence_locations, dependent: :destroy
end
