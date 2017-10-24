class SequenceLocator < ApplicationRecord
  belongs_to :postprocess_run
  belongs_to :pipeline_output
end
