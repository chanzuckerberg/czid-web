class Project < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    # WARNING: using this means you must ensure activerecord callbacks are
    #  called on all updates. This module updates elasticsearch using these
    #  callbacks. If you must circumvent them somehow (eg. using raw SQL or
    #  bulk_import) you must explicitly update elasticsearch appropriately.
    include ElasticsearchCallbacksHelper
  end
  include ReportHelper

  has_and_belongs_to_many :users
  has_many :samples, dependent: :destroy
  has_many :phylo_trees, -> { order(created_at: :desc) }, dependent: :restrict_with_exception
  has_many :persisted_backgrounds, dependent: :destroy
  # TODO: Pick dependent behavior for background
  has_one :background # rubocop:disable Rails/HasManyOrHasOneDependent
  has_and_belongs_to_many :metadata_fields
  belongs_to :creator, optional: true, class_name: 'User'
  has_many :project_workflow_versions, dependent: :destroy

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  # NOTE: not sure why these columns were not created as booleans
  validates :public_access, inclusion: { in: [0, 1] }
  # NOTE: all values of background_flag in prod db are currently zero.
  validates :background_flag, inclusion: { in: [0, 1] }, allow_nil: true
  # Description requirement added 2020-03-11
  validates :description, presence: true, if: :description_changed?

  before_create :add_default_metadata_fields

  # Constants related to sorting
  NAME_SORT_KEY = "name".freeze
  CREATED_AT_SORT_KEY = "id".freeze
  SAMPLE_COUNTS_SORT_KEY = "sample_counts".freeze
  HOSTS_SORT_KEY = "hosts".freeze
  SAMPLE_TYPES_SORT_KEY = "sample_type".freeze

  DATA_KEY_TO_SORT_KEY = {
    "project" => NAME_SORT_KEY,
    "created_at" => CREATED_AT_SORT_KEY,
    "sample_counts" => SAMPLE_COUNTS_SORT_KEY,
    "hosts" => HOSTS_SORT_KEY,
    "tissues" => SAMPLE_TYPES_SORT_KEY,
  }.freeze

  PROJECTS_SORT_KEYS = [NAME_SORT_KEY, CREATED_AT_SORT_KEY].freeze
  TIEBREAKER_SORT_KEY = "id".freeze

  scope :sort_by_sample_count, lambda { |order_dir|
    sample_count_alias = "total_sample_count"
    sorted_project_ids = select("projects.id, COUNT(DISTINCT samples.id) AS #{sample_count_alias}")
                         .left_joins(:samples)
                         .group(:id)
                         .order(Arel.sql("#{sample_count_alias} #{order_dir}, projects.#{TIEBREAKER_SORT_KEY} #{order_dir}"))
                         .collect(&:id)

    where(id: sorted_project_ids).order(Arel.sql("field(projects.id, #{sorted_project_ids.join ','})"))
  }

  # For these sort scopes, GROUP_CONCAT assembles a sort key, but the select filters out other fields
  # that may be in the ActiveRecord object passed in, so we perform one query to get a list of sorted
  # IDs, and then a second query to get the full object in sorted order
  scope :sort_by_hosts, lambda { |order_dir|
    host_genome_list_alias = "host_genome_list"
    sorted_project_ids = select("projects.id, GROUP_CONCAT(DISTINCT host_genomes.name ORDER BY host_genomes.name ASC) AS #{host_genome_list_alias}")
                         .left_joins(samples: [:host_genome])
                         .group(:id)
                         .order(Arel.sql("#{host_genome_list_alias} #{order_dir}, projects.#{TIEBREAKER_SORT_KEY} #{order_dir}"))
                         .collect(&:id)

    where(id: sorted_project_ids).order(Arel.sql("field(projects.id, #{sorted_project_ids.join ','})"))
  }

  scope :sort_by_sample_types, lambda { |order_dir|
    sample_type_list_alias = "sample_types_list"
    metadata_sample_type_key = "sample_type"
    sorted_project_ids = select("projects.id, GROUP_CONCAT(DISTINCT metadata.string_validated_value ORDER BY metadata.string_validated_value ASC) AS #{sample_type_list_alias}")
                         .left_joins(:samples)
                         .joins("LEFT OUTER JOIN metadata ON (metadata.sample_id=samples.id) AND metadata.key='#{metadata_sample_type_key}'")
                         .group(:id)
                         .order(Arel.sql("#{sample_type_list_alias} #{order_dir}, projects.#{TIEBREAKER_SORT_KEY} #{order_dir}"))
                         .collect(&:id)

    where(id: sorted_project_ids).order(Arel.sql("field(projects.id, #{sorted_project_ids.join ','})"))
  }

  # Disable samples function. have to go through power
  alias samples_unsafe samples
  def samples
    nil
  end

  def cleaned_project_name
    name.downcase.split(' ').join('_')
  end

  # search is used by ES
  def self.search_by_name(query)
    if query
      tokens = query.scan(/\w+/).map { |t| "%#{t}%" }
      q = scoped
      tokens.each do |token|
        q = q.where("projects.name LIKE :search", search: token.to_s)
      end
      q
    else
      scoped
    end
  end

  def self.editable(user)
    if user.admin?
      all
    else
      where("projects.id in (select project_id from projects_users where user_id=?)", user.id)
    end
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      where("projects.id in (select project_id from projects_users where user_id=?)
             or
             projects.id in (?) ",
            user.id,
            Sample.public_samples.distinct.pluck(:project_id))
    end
  end

  def self.public_projects
    where("projects.id in (?)", Sample.public_samples.distinct.pluck(:project_id))
  end

  def self.fetch_and_pin_alignment_config(project_id)
    pinned_alignment_config = VersionRetrievalService.call(project_id, AlignmentConfig::NCBI_INDEX)
    VersionPinningService.call(project_id, AlignmentConfig::NCBI_INDEX, pinned_alignment_config)
    pinned_alignment_config
  end

  def add_default_metadata_fields
    metadata_fields.push(MetadataField.where(is_default: 1) - metadata_fields)
  end

  def status_url
    UrlUtil.absolute_base_url + "/projects/#{id}"
  end

  # order_by stores a sortable column's dataKey (refer to: ProjectsView.jsx)
  def self.sort_projects(projects, order_by, order_dir)
    sort_key = DATA_KEY_TO_SORT_KEY[order_by]

    if PROJECTS_SORT_KEYS.include?(sort_key)
      projects.order("projects.#{sort_key} #{order_dir}, projects.#{TIEBREAKER_SORT_KEY} #{order_dir}")
    elsif sort_key == SAMPLE_COUNTS_SORT_KEY
      projects.sort_by_sample_count(order_dir)
    elsif sort_key == HOSTS_SORT_KEY
      projects.sort_by_hosts(order_dir)
    elsif sort_key == SAMPLE_TYPES_SORT_KEY
      projects.sort_by_sample_types(order_dir)
    else
      projects
    end
  end
end
