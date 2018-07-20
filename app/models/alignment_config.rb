class AlignmentConfig < ApplicationRecord
  # configuration for alignment database for pipelines
  DEFAULT_NAME = '2018-02-15'.freeze
  has_many :pipeline_runs
end
