class BulkDownload < ApplicationRecord
  has_and_belongs_to_many :pipeline_runs
end
