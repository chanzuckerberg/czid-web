class TaxonCount < ApplicationRecord
  belongs_to :pipeline_output
  TAX_LEVEL_SPECIES = 1
  TAX_LEVEL_GENUS = 2
  COUNT_TYPE_NT = 'NT'.freeze
  COUNT_TYPE_NR = 'NR'.freeze
  scope :type, ->(count_type) { where(count_type: count_type) }
  scope :level, ->(tax_level) { where(tax_level: tax_level) }
  scope :tax_id, ->(tax_id) { where(tax_id: tax_id) }
end
