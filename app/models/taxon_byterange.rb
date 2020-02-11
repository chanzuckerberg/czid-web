class TaxonByterange < ApplicationRecord
  belongs_to :pipeline_run
  validates :pipeline_run, presence: true

  validates :hit_type, presence: true, inclusion: { in: [
    TaxonCount::COUNT_TYPE_NT,
    TaxonCount::COUNT_TYPE_NR,
  ], }

  validates :first_byte, numericality: { greater_than_or_equal_to: 0 }
  validates :last_byte, numericality: { greater_than_or_equal_to: 1 }
end
