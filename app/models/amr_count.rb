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
  validates :pipeline_run, presence: true

  # AmrCount is designed to handle partial data. See pipeline_run_spec.rb.
  validates :coverage, inclusion: 0..100, allow_nil: true
  validates :depth, numericality: { greater_than: 0 }, allow_nil: true
end
