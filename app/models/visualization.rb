# Represents a Heatmap, phylogeny or other visualization
class Visualization < ApplicationRecord
  serialize :data, JSON
  has_and_belongs_to_many :samples
  belongs_to :user

  def samples_count
    if visualization_type == "phylo_tree"
      # WARNING: this could be an N+1 query
      # TODO: (gdingle): store at write time if it is immutable
      Sample.where(project: phylo_tree.project).count
    else
      samples.count
    end
  end

  def phylo_tree
    PhyloTree.find(data["treeId"])
  end

  def name
    if visualization_type == "phylo_tree"
      # WARNING: this could be an N+1 query
      # TODO: (gdingle): store name at write time if it is immutable
      phylo_tree.name
    elsif samples.length == 1
      samples[0].name
    elsif samples.length > 1
      names = samples.map(&:name)
      # make a string such as "Patient 016 (CSF) and 015 (CSF)"
      prefix = longest_common_prefix(names)
      if prefix.include?(' ')
        # Use whole words only
        # TODO: (gdingle): add other delimiters than space
        prefix = prefix.split(' ')[0..-2].join(' ')
      end
      names.each_with_index.map do |name, i|
        i > 0 ? name.delete_prefix(prefix) : name
      end.to_sentence
    else
      "unknown"
    end
  end

  # In the common case, a visualization will come from a single project.
  def project_name
    # WARNING: this could be an N+1 query
    # TODO: (gdingle): store name at write time if it is immutable
    if visualization_type == "phylo_tree"
      phylo_tree.project.name
    elsif samples.length == 1
      samples[0].project.name
    elsif samples.length > 1
      names = samples.map { |sample| sample.project.name }
      names.uniq.to_sentence
    else
      "unknown"
    end
  end

  private

  # See https://rosettacode.org/wiki/Longest_common_prefix#Ruby
  def longest_common_prefix(strs)
    return "" if strs.empty?
    min, max = strs.minmax
    idx = min.size.times { |i| break i if min[i] != max[i] }
    min[0...idx]
  end
end
