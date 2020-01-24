class HostGenome < ApplicationRecord
  has_many :samples, dependent: :restrict_with_exception
  has_and_belongs_to_many :metadata_fields

  before_create :add_default_metadata_fields

  validates :name, presence: true, uniqueness: { case_sensitive: false }, format: {
    with: /\A[A-Z][\w|\s|\.|\-]+\z/,
    message: "of host organism allows only word, period, dash or space chars, and first char must be capitalized.",
  }

  validates :s3_bowtie2_index_path, :s3_star_index_path, format: {
    with: %r{\As3://.*\z},
    message: "should be located in s3.",
  }

  # NOTE: not sure why this columns was not created as boolean
  validates :skip_deutero_filter, inclusion: { in: [0, 1] }

  validates :taxa_category, inclusion: { allow_blank: true, in: [
    # From "Sample Type Groupings" at
    # https://docs.google.com/spreadsheets/d/1_hPkQe5LI0Zw_C0Ls4HVCEDsc_FNNVOaU_aAfoaiZRE/
    "human",
    "insect",
  ], }, if: -> { respond_to?(:taxa_category) } # for migrations

  ERCC_PATH_PREFIX = "s3://idseq-database/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/".freeze
  S3_STAR_INDEX_FILE = "STAR_genome.tar".freeze
  S3_BOWTIE2_INDEX_FILE = "bowtie2_genome.tar".freeze

  def self.s3_star_index_path_default
    HostGenome::ERCC_PATH_PREFIX + HostGenome::S3_STAR_INDEX_FILE
  end

  def self.s3_bowtie2_index_path_default
    HostGenome::ERCC_PATH_PREFIX + HostGenome::S3_BOWTIE2_INDEX_FILE
  end

  def default_background
    Background.find(default_background_id) if default_background_id
  end

  def add_default_metadata_fields
    # Cat Genome was created in migrations before MetadataField table, so need to check this for the test db migrations.
    if MetadataField.table_exists?
      self.metadata_fields = MetadataField.where(default_for_new_host_genome: 1)
    end
  end

  # This should be true for all host genomes created without index files, and
  # the "ERCC only" genome.
  def ercc_only?
    s3_star_index_path.starts_with?(HostGenome::ERCC_PATH_PREFIX) &&
      s3_bowtie2_index_path.starts_with?(HostGenome::ERCC_PATH_PREFIX)
  end
end
