class Report < ApplicationRecord
  belongs_to :pipeline_output
  belongs_to :background, optional: true
end
