# configuration for alignment database for pipelines
class AlignmentConfig < ApplicationRecord
  has_many :pipeline_runs, dependent: :restrict_with_exception

  validates :name, presence: true, uniqueness: true

  # configuration for alignment database for pipelines
  #   set in SSM and loaded via chamber
  DEFAULT_NAME = ENV["ALIGNMENT_CONFIG_DEFAULT_NAME"]

  # Get the max lineage version from a set of alignment config ids.
  def self.max_lineage_version(alignment_config_ids)
    AlignmentConfig
      .select("lineage_version")
      .where(id: alignment_config_ids)
      .maximum(:lineage_version)
  end
end
