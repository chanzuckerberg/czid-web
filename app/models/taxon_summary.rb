# This model gives, for each taxon, summary statistics (mean count, standard deviation) of the background model.
class TaxonSummary < ApplicationRecord
  belongs_to :background
  # NOTE: this conflicts with pipeline_report_service_spec.rb
  # belongs_to :taxon_lineage, class_name: "TaxonLineage", foreign_key: :tax_id, primary_key: :taxid

  validates :count_type, presence: true, inclusion: { in: [
    TaxonCount::COUNT_TYPE_NT,
    TaxonCount::COUNT_TYPE_NR,
    # Unclear meaning. Exists in database, but not in codebase.
    "NT+",
    "NR+",
  ], }, if: :mass_validation_enabled?
  validates :tax_level, presence: true, inclusion: { in: [
    TaxonCount::TAX_LEVEL_SPECIES,
    TaxonCount::TAX_LEVEL_GENUS,
    TaxonCount::TAX_LEVEL_FAMILY,
  ], }, if: :mass_validation_enabled?

  validates :mean, numericality: { greater_than_or_equal_to: 0 }, if: :mass_validation_enabled?
  validates :stdev, numericality: { greater_than_or_equal_to: 0 }, if: :mass_validation_enabled?
end
