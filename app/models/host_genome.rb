class HostGenome < ApplicationRecord
  has_many :samples, dependent: :restrict_with_exception
  has_and_belongs_to_many :metadata_fields

  validates :name, presence: true, uniqueness: true

  before_create :add_default_metadata_fields

  belongs_to :default_background, class_name: "Background", foreign_key: :default_background_id

  def add_default_metadata_fields
    # Cat Genome was created in migrations before MetadataField table, so need to check this for the test db migrations.
    if MetadataField.table_exists?
      self.metadata_fields = MetadataField.where(default_for_new_host_genome: 1)
    end
  end
end
