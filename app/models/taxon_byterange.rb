class TaxonByterange < ApplicationRecord
  belongs_to :pipeline_run
  belongs_to :taxon_lineage, class_name: "TaxonLineage", foreign_key: :tax_id, primary_key: :taxid

  validates :hit_type, presence: true, inclusion: { in: [
    TaxonCount::COUNT_TYPE_NT,
    TaxonCount::COUNT_TYPE_NR,
  ], }, if: :mass_validation_enabled?

  validates :first_byte, numericality: { greater_than_or_equal_to: 0 }, if: :mass_validation_enabled?
  validates :last_byte, numericality: { greater_than_or_equal_to: 1 }, if: :mass_validation_enabled?
end
