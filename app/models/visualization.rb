# Represents a Heatmap, phylogeny or other visualization
class Visualization < ApplicationRecord
  serialize :data, JSON
  has_and_belongs_to_many :samples
  belongs_to :user

  def name
    if type == "phylo_tree"
      vis.data["name"]
    elsif samples.length == 1
      samples[0].name
    elsif samples.length > 1
      names = samples.map(&:name)
      prefix = longest_common_prefix(*names)
      names.map { |name| name.delete_prefix(prefix) }
      names.to_sentence
    else
      "unknown"
    end
  end

  private

  # See https://rosettacode.org/wiki/Longest_common_prefix#Ruby
  def longest_common_prefix(*strs)
    return "" if strs.empty?
    min, max = strs.minmax
    idx = min.size.times { |i| break i if min[i] != max[i] }
    min[0...idx]
  end
end
