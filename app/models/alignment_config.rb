class AlignmentConfig < ApplicationRecord
  DEFAULT_NAME = '2018-02-01'.freeze
  has_many :pipeline_runs
end
