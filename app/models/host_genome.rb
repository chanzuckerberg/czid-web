class HostGenome < ApplicationRecord
  has_many :samples, dependent: :restrict_with_exception
  has_and_belongs_to_many :metadata_fields

  validates :taxa_category, inclusion: { in: [
    # From "Sample Type Groupings" at
    # https://docs.google.com/spreadsheets/d/1_hPkQe5LI0Zw_C0Ls4HVCEDsc_FNNVOaU_aAfoaiZRE/
    "human",
    "insect",
  ], }

  before_create :add_default_metadata_fields

  def default_background
    Background.find(default_background_id) if default_background_id
  end

  def add_default_metadata_fields
    # Cat Genome was created in migrations before MetadataField table, so need to check this for the test db migrations.
    if MetadataField.table_exists?
      self.metadata_fields = MetadataField.where(default_for_new_host_genome: 1)
    end
  end
end
