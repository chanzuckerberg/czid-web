# Represents a Heatmap, phylogeny or other visualization
class Visualization < ApplicationRecord
  serialize :data, JSON
  has_and_belongs_to_many :samples
  belongs_to :user, counter_cache: true # use .size for cache, use .count to force COUNT query
  validates :name, presence: true
  validates :data, presence: true

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
end
