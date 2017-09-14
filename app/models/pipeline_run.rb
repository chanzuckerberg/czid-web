class PipelineRun < ApplicationRecord
  belongs_to :sample
  has_one :pipeline_output
end
