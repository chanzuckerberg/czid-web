# This model gives, for each taxon, summary statistics (mean count, standard deviation) of the background model.
class TaxonSummary < ApplicationRecord
  belongs_to :background
  validates :background, presence: true
  belongs_to :taxon_lineage, class_name: "TaxonLineage", foreign_key: :tax_id, primary_key: :taxid

  validates :count_type, presence: true, inclusion: { in: [
    TaxonCount::COUNT_TYPE_NT,
    TaxonCount::COUNT_TYPE_NR,
    # Unclear meaning. Exists in database, but not in codebase.
    "NT+",
    "NR+",
  ], }
  validates :tax_level, presence: true, inclusion: { in: [
    TaxonCount::TAX_LEVEL_SPECIES,
    TaxonCount::TAX_LEVEL_GENUS,
    TaxonCount::TAX_LEVEL_FAMILY,
  ], }

  validates :mean, numericality: { greater_than_or_equal_to: 0 }
  validates :stdev, numericality: { greater_than_or_equal_to: 0 }
end
