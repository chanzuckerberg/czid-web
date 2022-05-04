# Represents a Heatmap, phylogeny or other visualization
class Visualization < ApplicationRecord
  has_and_belongs_to_many :samples
  belongs_to :user, counter_cache: true # use .size for cache, use .count to force COUNT query

  validates :name, presence: true

  HEATMAP_TYPE = "heatmap".freeze
  PHYLO_TREE_TYPE = "phylo_tree".freeze
  PHYLO_TREE_NG_TYPE = "phylo_tree_ng".freeze
  TREE_TYPE = "tree".freeze
  TABLE_TYPE = "table".freeze
  validates :visualization_type, presence: true, inclusion: { in: [
    HEATMAP_TYPE,
    PHYLO_TREE_TYPE,
    PHYLO_TREE_NG_TYPE,
    TREE_TYPE,
    TABLE_TYPE,
  ] }
  validates :data, presence: true

  serialize :data, JSON

  delegate :count, to: :samples, prefix: true

  # Constants related to sorting
  NAME_SORT_KEY = "name".freeze
  UPDATED_AT_SORT_KEY = "updated_at".freeze
  PROJECT_SORT_KEY = "project".freeze
  SAMPLES_COUNT_SORT_KEY = "samples_count".freeze
  DATA_KEY_TO_SORT_KEY = {
    "visualization" => NAME_SORT_KEY,
    "samples_count" => SAMPLES_COUNT_SORT_KEY,
    "updated_at" => UPDATED_AT_SORT_KEY,
    "project_name" => PROJECT_SORT_KEY,
  }.freeze
  VISUALIZATIONS_SORT_KEYS = [NAME_SORT_KEY, UPDATED_AT_SORT_KEY].freeze
  TIEBREAKER_SORT_KEY = "id".freeze

  scope :sort_by_sample_count, lambda { |order_dir|
    order_statement = "COUNT(samples.id) #{order_dir}, visualizations.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    left_outer_joins(:samples).group(:id).order(ActiveRecord::Base.sanitize_sql_array(order_statement))
  }

  scope :sort_by_projects, lambda { |order_dir|
    project_list_alias = "project_list"

    sorted_visualization_ids =
      select("visualizations.id, GROUP_CONCAT(DISTINCT projects.name ORDER BY projects.name ASC) AS #{project_list_alias}")
      .left_joins(samples: [:project])
      .group(:id)
      .order(Arel.sql("#{project_list_alias} #{order_dir}, visualizations.#{TIEBREAKER_SORT_KEY} #{order_dir}"))
      .collect(&:id)

    where(id: sorted_visualization_ids).order(Arel.sql("field(visualizations.id, #{sorted_visualization_ids.join ','})"))
  }

  # In the common case, a visualization will come from a single project.
  def project_name
    if samples.length == 1
      samples[0].project.name
    elsif samples.length > 1
      names = samples.map { |sample| sample.project.name }
      names.uniq.sort_by(&:downcase).to_sentence
    else
      "unknown"
    end
  end

  def self.db_search(search)
    if search
      search = search.strip
      where("visualizations.name LIKE :search OR visualizations.visualization_type LIKE :search", search: "%#{search}%")
    else
      scoped
    end
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      where(public_access: 1).or(Visualization.where(user_id: user.id))
    end
  end

  def self.public
    where(public_access: 1)
  end

  # order_by stores a sortable column's dataKey (refer to: VisualizationsView.jsx)
  def self.sort_visualizations(visualizations, order_by, order_dir)
    sort_key = DATA_KEY_TO_SORT_KEY[order_by.to_s]

    if VISUALIZATIONS_SORT_KEYS.include?(sort_key)
      visualizations.order("visualizations.#{sort_key} #{order_dir}, visualizations.#{TIEBREAKER_SORT_KEY} #{order_dir}")
    elsif sort_key == SAMPLES_COUNT_SORT_KEY
      visualizations.sort_by_sample_count(order_dir)
    elsif sort_key == PROJECT_SORT_KEY
      visualizations.sort_by_projects(order_dir)
    else
      visualizations
    end
  end
end
