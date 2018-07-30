class AlignmentConfig < ApplicationRecord
  # configuration for alignment database for pipelines
  DEFAULT_NAME = '2018-04-01'.freeze
  has_many :pipeline_runs
end
