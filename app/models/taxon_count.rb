# NOTE: validations are typically skipped because of update_all in results loader.
class TaxonCount < ApplicationRecord
  belongs_to :pipeline_run
  # NOTE: TaxonCount also has tax_id which is a key into TaxonLineage

  TAX_LEVEL_SPECIES = 1
  TAX_LEVEL_GENUS = 2
  TAX_LEVEL_FAMILY = 3
  TAX_LEVEL_ORDER = 4
  TAX_LEVEL_CLASS = 5
  TAX_LEVEL_PHYLUM = 6
  TAX_LEVEL_KINGDOM = 7
  TAX_LEVEL_SUPERKINGDOM = 8
  validates :tax_level, presence: true, inclusion: { in: [
    TAX_LEVEL_SPECIES,
    TAX_LEVEL_GENUS,
    TAX_LEVEL_FAMILY,
    TAX_LEVEL_ORDER,
    TAX_LEVEL_CLASS,
    TAX_LEVEL_PHYLUM,
    TAX_LEVEL_KINGDOM,
    TAX_LEVEL_SUPERKINGDOM,
  ], }, if: :validate_all?

  COUNT_TYPE_NT = 'NT'.freeze
  COUNT_TYPE_NR = 'NR'.freeze
  validates :count_type, presence: true, inclusion: { in: [
    COUNT_TYPE_NT,
    COUNT_TYPE_NR,
  ], }, if: :validate_all?

  # TODO: (gdingle): is it really okay to have a count of zero? that's what
  # some existing rspec tests assume.
  validates :count, numericality: { greater_than_or_equal_to: 0 }, if: :validate_all?

  validates :percent_identity, inclusion: 0..100, if: :validate_all?
  # TODO: (gdingle): is it really okay to have a alignment_length of zero?
  # that's what some existing rspec tests assume.
  validates :alignment_length, numericality: { greater_than_or_equal_to: 0 }, if: :validate_all?

  NAME_2_LEVEL = { 'species' => TAX_LEVEL_SPECIES,
                   'genus' => TAX_LEVEL_GENUS,
                   'family' => TAX_LEVEL_FAMILY,
                   'order' => TAX_LEVEL_ORDER,
                   'class' => TAX_LEVEL_CLASS,
                   'phylum' => TAX_LEVEL_PHYLUM,
                   'kingdom' => TAX_LEVEL_KINGDOM,
                   'superkingdom' => TAX_LEVEL_SUPERKINGDOM, }.freeze
  LEVEL_2_NAME = NAME_2_LEVEL.invert

  scope :type, ->(count_type) { where(count_type: count_type) }
  scope :level, ->(tax_level) { where(tax_level: tax_level) }
end
