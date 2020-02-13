# Represents a Heatmap, phylogeny or other visualization
class Visualization < ApplicationRecord
  has_and_belongs_to_many :samples
  belongs_to :user, counter_cache: true # use .size for cache, use .count to force COUNT query

  validates :name, presence: true

  HEATMAP_TYPE = "heatmap".freeze
  PHYLO_TREE_TYPE = "phylo_tree".freeze
  TREE_TYPE = "tree".freeze
  TABLE_TYPE = "table".freeze
  validates :visualization_type, presence: true, inclusion: { in: [
    HEATMAP_TYPE,
    PHYLO_TREE_TYPE,
    TREE_TYPE,
    TABLE_TYPE,
  ], }, if: :mass_validation_enabled?
  validates :data, presence: true, if: :mass_validation_enabled?

  serialize :data, JSON

  delegate :count, to: :samples, prefix: true

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
end
