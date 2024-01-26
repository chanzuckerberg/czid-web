class HostGenome < ApplicationRecord
  has_many :samples, dependent: :restrict_with_exception
  has_and_belongs_to_many :metadata_fields
  # The user that created the host genome should be recorded after 2020-02-01.
  # IMPORTANT NOTE: Only existing, null-user host genomes will be shown as
  # options for new samples until the team gets a chance to review this policy
  # in light of the data. See showAsOption below.
  # See https://jira.czi.team/browse/IDSEQ-2193.
  belongs_to :user, optional: true
  belongs_to :default_background, optional: true, class_name: "Background"

  # HostGenomes can have multiple versions for a given host (that is, `name`).
  # This allows us to keep around index file references for older versions of
  # the host and generally restrict the use of old versions. For example, we can
  # display a single "Human" as a host option, but have multiple versions of
  # "Human", then do things like ensuring old projects use their original version,
  # while new projects get the latest "Human" version. That said, the vast majority
  # of hosts only have a single version and just one HostGenome record.
  # If a host has multiple versions, only the newest version should be considered
  # non-deprecated. All old versions need non-NULL values for deprecation_status.
  # See https://czi-tech.atlassian.net/browse/CZID-8173 for more info.
  validates :name, presence: true, uniqueness: {
    case_sensitive: false,
    scope: :version,
    message: "plus `version` must be unique, e.g., you can not have two version 1 rows for a name.",
  }, format: {
    with: /\A\w[\w|\s|\.|\-]+\z/,
    message: "of host organism allows only word, period, dash or space chars, and must start with a word char.",
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
    "unknown",
    "non-human-animal",
  ], }, if: -> { respond_to?(:taxa_category) } # for migrations

  before_create :add_default_metadata_fields!

  # NOTE: Consider updating the star and bowtie defaults if we ever add new ERCC index files.
  ERCC_DIRECTORY_PATH = "host_filter/ercc".freeze
  ERCC_PATH_PREFIX = "s3://#{S3_DATABASE_BUCKET}/#{ERCC_DIRECTORY_PATH}/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/".freeze
  S3_STAR_INDEX_FILE = "STAR_genome.tar".freeze
  S3_BOWTIE2_INDEX_FILE = "bowtie2_genome.tar".freeze

  # Attribute key we set/get on for what version of human a project is using.
  # On project creation, we pin to whatever is currently the latest version of human.
  HUMAN_HOST = "human_host_genome".freeze

  def self.s3_star_index_path_default
    HostGenome::ERCC_PATH_PREFIX + HostGenome::S3_STAR_INDEX_FILE
  end

  def self.s3_bowtie2_index_path_default
    HostGenome::ERCC_PATH_PREFIX + HostGenome::S3_BOWTIE2_INDEX_FILE
  end

  def self.all_without_metadata_field(name)
    exists = joins(:metadata_fields).where(metadata_fields: { name: [name] }).distinct
    where.not(id: exists)
  end

  def as_json(options = {})
    hash = super(options)
    hash[:showAsOption] = show_as_option?
    unless options[:public]
      hash[:ercc_only] = ercc_only?
    end
    hash
  end

  def add_default_metadata_fields!
    # Cat Genome was created in migrations before MetadataField table, so need to check this for the test db migrations.
    if MetadataField.table_exists?
      self.metadata_fields = MetadataField.where(default_for_new_host_genome: 1)
    end
  end

  # This should be true for all host genomes created without index files, and
  # the "ERCC only" genome.
  def ercc_only?
    s3_star_index_path.include?(HostGenome::ERCC_DIRECTORY_PATH) &&
      s3_bowtie2_index_path.include?(HostGenome::ERCC_DIRECTORY_PATH)
  end

  # We only show NULL user HostGenomes (per IDSEQ-2193, see above for more).
  # Additionally, if the `deprecation_status` is anything other than NULL, we
  # consider that to be a deprecated record, and it should not be presented as
  # an option to choose from.
  def show_as_option?
    user.nil? && deprecation_status.nil?
  end
end
