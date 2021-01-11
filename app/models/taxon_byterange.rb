class TaxonByterange < ApplicationRecord
  belongs_to :pipeline_run
  # NOTE: this conflicts with phylo_trees_controller_spec.rb
  # belongs_to :taxon_lineage, class_name: "TaxonLineage", foreign_key: :tax_id, primary_key: :taxid

  validates :hit_type, presence: true, inclusion: { in: [
    TaxonCount::COUNT_TYPE_NT,
    TaxonCount::COUNT_TYPE_NR,
  ] }

  validates :first_byte, numericality: { greater_than_or_equal_to: 0 }
  validates :last_byte, numericality: { greater_than_or_equal_to: 0 }
end
