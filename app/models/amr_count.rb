# Model that has data fields necessary for displaying
# anti microbial resistance (AMR) information for a
# given pipeline run of a sample.
#
# Currently the following values exist for drug_family:
#   ["AGly",
#   "Bla",
#   "Colistin",
#   "Ecoli_Bla",
#   "Fcd",
#   "Fcyn",
#   "Flq",
#   "Gly",
#   "hydrolase_Bla",
#   "MLS",
#   "Nitroimidazole_Gene_Ntmdz",
#   "Oxzln",
#   "Phe",
#   "Rif",
#   "Sul",
#   "Tet",
#   "Tmt"]
class AmrCount < ApplicationRecord
  belongs_to :pipeline_run
  # AmrCount is designed to handle partial data. See db_load_amr_counts.
  validates :gene, presence: true, allow_nil: true, if: :mass_validation_enabled?
  validates :allele, presence: true, allow_nil: true, if: :mass_validation_enabled?
  validates :drug_family, presence: true, allow_nil: true, if: :mass_validation_enabled?
  validates :annotation_gene, presence: true, allow_nil: true, if: :mass_validation_enabled?
  validates :genbank_accession, presence: true, allow_nil: true, if: :mass_validation_enabled?
  validates :coverage, inclusion: 0..100, allow_nil: true, if: :mass_validation_enabled?
  validates :depth, numericality: { greater_than: 0 }, allow_nil: true, if: :mass_validation_enabled?
  validates :total_reads, numericality: { greater_than: 0, integer_only: true }, allow_nil: true, if: :mass_validation_enabled?
  validates :dpm, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true, if: :mass_validation_enabled?
  validates :rpm, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true, if: :mass_validation_enabled?
end
