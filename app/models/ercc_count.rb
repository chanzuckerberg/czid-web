require 'csv'

class ErccCount < ApplicationRecord
  belongs_to :pipeline_run
  validates :pipeline_run, presence: true

  validates :count, numericality: { greater_than_or_equal_to: 0 }
  validates :name, presence: true

  ercc_csv = File.join(File.dirname(__FILE__), '../lib/ercc_data.csv')
  BASELINE = CSV.table(ercc_csv).map(&:to_hash)
end
