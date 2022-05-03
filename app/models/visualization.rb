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
  DATA_KEY_TO_SORT_KEY = {
    "visualization" => "name",
    "updated_at" => "updated_at",
    "samples_count" => "samples_count",
  }.freeze
  VISUALIZATIONS_SORT_KEYS = ["name", "updated_at"].freeze
  TIEBREAKER_SORT_KEY = "id".freeze

  scope :sort_by_sample_count, lambda { |order_dir|
    order_statement = "COUNT(samples.id) #{order_dir}, visualizations.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    left_outer_joins(:samples).group(:id).order(ActiveRecord::Base.sanitize_sql_array(order_statement))
  }

  # In the common case, a visualization will come from a single project.
  def project_name
    if samples.length == 1
      samples[0].project.name
    elsif samples.length > 1
      names = samples.map { |sample| sample.project.name }
      names.uniq.to_sentence
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
    visualizations = visualizations.order("visualizations.#{sort_key} #{order_dir}, visualizations.#{TIEBREAKER_SORT_KEY} #{order_dir}") if VISUALIZATIONS_SORT_KEYS.include?(sort_key)
    visualizations = visualizations.sort_by_sample_count(order_dir) if sort_key == "samples_count"
    visualizations
  end
end
