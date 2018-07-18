class AlignmentConfig < ApplicationRecord
  DEFAULT_NAME = '2018-02-15'.freeze
  has_many :pipeline_runs
end
