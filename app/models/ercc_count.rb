# ERCC refers to the External RNA Controls Consortium. Power users may be
# trained to use "ERCC spike-in controls" in their sample preparation, and the
# idea is that you should be able to verify these ERCC count concentrations
# after sample processing as a form of quality control.

require 'csv'

class ErccCount < ApplicationRecord
  belongs_to :pipeline_run

  validates :count, numericality: { greater_than_or_equal_to: 0 }
  validates :name, presence: true

  ercc_csv = File.join(File.dirname(__FILE__), '../lib/ercc_data.csv')
  BASELINE = CSV.table(ercc_csv).map(&:to_hash)
end
