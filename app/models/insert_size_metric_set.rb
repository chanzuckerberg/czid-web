class InsertSizeMetricSet < ApplicationRecord
  validates :pipeline_run_id, presence: true, numericality: :only_integer
  validates :median, presence: true, numericality: :only_integer
  validates :mode, presence: true, numericality: :only_integer
  validates :median_absolute_deviation, presence: true, numericality: :only_integer
  validates :min, presence: true, numericality: :only_integer
  validates :max, presence: true, numericality: :only_integer
  validates :mean, presence: true, numericality: true
  validates :standard_deviation, presence: true, numericality: true
  validates :read_pairs, presence: true, numericality: :only_integer

  belongs_to :pipeline_run
end
