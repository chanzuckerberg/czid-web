class TaxonZscore < ApplicationRecord
  belongs_to :report
  scope :type, ->(hit_type) { where(hit_type: hit_type) }
  scope :level, ->(tax_level) { where(tax_level: tax_level) }
end
