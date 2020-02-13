class InsertSizeMetricSet < ApplicationRecord
  belongs_to :pipeline_run, optional: true
end
