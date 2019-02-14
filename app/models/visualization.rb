# Represents a Heatmap, phylogeny or other visualization
class Visualization < ApplicationRecord
  serialize :data, JSON
  has_and_belongs_to_many :samples
  belongs_to :user
end
