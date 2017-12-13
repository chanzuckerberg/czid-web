class TaxonCount < ApplicationRecord
  belongs_to :pipeline_output
  TAX_LEVEL_SPECIES = 1
  TAX_LEVEL_GENUS = 2
  TAX_LEVEL_FAMILY = 3
  TAX_LEVEL_ORDER = 4
  TAX_LEVEL_CLASS = 5
  TAX_LEVEL_PHYLUM = 6
  COUNT_TYPE_NT = 'NT'.freeze
  COUNT_TYPE_NR = 'NR'.freeze
  NAME_2_LEVEL = { 'species' => TAX_LEVEL_SPECIES,
                   'genus' => TAX_LEVEL_GENUS,
                   'family' => TAX_LEVEL_FAMILY,
                   'order' => TAX_LEVEL_ORDER,
                   'class' => TAX_LEVEL_CLASS,
                   'phylum' => TAX_LEVEL_PHYLUM }.freeze
  scope :type, ->(count_type) { where(count_type: count_type) }
  scope :level, ->(tax_level) { where(tax_level: tax_level) }
end
