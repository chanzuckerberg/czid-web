class HostGenome < ApplicationRecord
  has_many :samples

  def default_background
    Background.find(default_background_id) if default_background_id
  end

  def self.exposed_genomes
    all.map(&:name).reject { |n| n.downcase.include?("__test__") || n.downcase.include?("no host subtraction") }
  end
end
