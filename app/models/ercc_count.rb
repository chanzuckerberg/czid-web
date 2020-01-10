require 'csv'

class ErccCount < ApplicationRecord
  belongs_to :pipeline_run
  ercc_csv = File.join(File.dirname(__FILE__), '../lib/ercc_data.csv')
  BASELINE = CSV.table(ercc_csv).map(&:to_hash)
end
