class AlignmentConfig < ApplicationRecord
  # configuration for alignment database for pipelines
  DEFAULT_NAME = ENV["ALIGNMENT_CONFIG_DEFAULT_NAME"]
  has_many :pipeline_runs, dependent: :restrict_with_exception
end
