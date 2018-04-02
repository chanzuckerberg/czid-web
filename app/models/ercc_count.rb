require 'csv'

class ErccCount < ApplicationRecord
  belongs_to :pipeline_run
  BASELINE = CSV.table('app/lib/ercc_data.csv').map(&:to_hash)
end
