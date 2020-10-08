# From "Sample Type Groupings" at
# https://docs.google.com/spreadsheets/d/1_hPkQe5LI0Zw_C0Ls4HVCEDsc_FNNVOaU_aAfoaiZRE/
# Each sample type represents a canonical, mutually-exclusive type supported by IDseq.
class SampleType < ApplicationRecord
  validates :name, :group, presence: true
  validates :name, uniqueness: true
  validates :name, :group, format: {
    with: /\A[A-Z][\w|\s]+\z/,
    message: "allows only word or space chars and first char must be capitalized.",
  }
  # names should fit inside autocomplete popup
  validates :name, :group, length: { in: 3..30 }
  validates :group, inclusion: { in: [
    # See CreateSampleTypes
    'Systemic Inflammation',
    'Central Nervous System',
    'Respiratory Tract',
    'Reproductive Tract',
    'Excrement',
    'Organs',
    'Insect Body Parts',
    'Other',
  ] }
end
