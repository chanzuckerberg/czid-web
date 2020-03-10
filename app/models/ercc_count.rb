require 'csv'

class ErccCount < ApplicationRecord
  belongs_to :pipeline_run

  validates :count, numericality: { greater_than_or_equal_to: 0 }, if: :mass_validation_enabled?
  validates :name, presence: true, if: :mass_validation_enabled?

  ercc_csv = File.join(File.dirname(__FILE__), '../lib/ercc_data.csv')
  BASELINE = CSV.table(ercc_csv).map(&:to_hash)
end
