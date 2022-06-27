# What is a taxon?
# * A taxon is a group or ranking in the biological classification system. Each
#   level of the taxonomy has a corresponding taxid (taxon ID). For example, in
#   NCBI, Escherichia coli has the rank of Species and taxid 562. The genus
#   Escherichia has taxid 562. The family Enterobacteriaceae has taxid 543. And
#   so forth. Collectively that would represent the lineage of the taxon.
#
# What is a taxon count?
# * A taxon count is an IDseq record representing the determined read counts and
#   other details at this taxon. For example, a sample might be determined to
#   contain 8,000 reads mapping to Klebsiella pneumoniae. You can think of it as
#   the record for displaying one row result on one report page.
# * Taxon counts are initially generated in the mngs Alignment stage, but then
#   refined in assembly steps in the Post Processing stage. See loader method
#   PipelineRun#db_load_taxon_counts.
#
# NOTE: Validations here are typically skipped because of update_all in results
# loader.
class TaxonCount < ApplicationRecord
  belongs_to :pipeline_run
  # NOTE: currently optional because some tests assume non-existant taxa
  belongs_to :taxon_lineage, class_name: "TaxonLineage", foreign_key: :tax_id, primary_key: :taxid, optional: true

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
  ] }

  COUNT_TYPE_NT = 'NT'.freeze
  COUNT_TYPE_NR = 'NR'.freeze
  # Single classifier that can either get results from NT, NR or both
  COUNT_TYPE_MERGED = 'merged_NT_NR'.freeze
  # Used to specify that source_count_type (for merged type) is both NT and NR
  COUNT_TYPE_NT_NR = 'NT-NR'.freeze
  validates :count_type, presence: true, inclusion: { in: [
    COUNT_TYPE_NT,
    COUNT_TYPE_NR,
    COUNT_TYPE_MERGED,
  ] }

  validates :source_count_type, allow_nil: true, inclusion: { in: [
    COUNT_TYPE_NT,
    COUNT_TYPE_NR,
    COUNT_TYPE_NT_NR,
  ] }

  # NOTE: some existing rspec tests assume a value of zero
  validates :count, numericality: { greater_than_or_equal_to: 0 }
  validates :percent_identity, inclusion: 0..100
  # NOTE: some existing rspec tests assume a value of zero
  validates :alignment_length, numericality: { greater_than_or_equal_to: 0 }
  validates :e_value, presence: true

  NAME_2_LEVEL = { 'species' => TAX_LEVEL_SPECIES,
                   'genus' => TAX_LEVEL_GENUS,
                   'family' => TAX_LEVEL_FAMILY,
                   'order' => TAX_LEVEL_ORDER,
                   'class' => TAX_LEVEL_CLASS,
                   'phylum' => TAX_LEVEL_PHYLUM,
                   'kingdom' => TAX_LEVEL_KINGDOM,
                   'superkingdom' => TAX_LEVEL_SUPERKINGDOM, }.freeze
  LEVEL_2_NAME = NAME_2_LEVEL.invert

  TAXON_COUNT_METRIC_FILTERS = ["count", "percent_identity", "alignment_length", "e_value", "rpm"].freeze
  COUNT_TYPES_FOR_FILTERING = [COUNT_TYPE_NT, COUNT_TYPE_NR].freeze
  LEVELS_FOR_FILTERING = ["species", "genus"].freeze

  scope :type, ->(count_type) { where(count_type: count_type) }
  scope :level, ->(tax_level) { where(tax_level: tax_level) }
end
