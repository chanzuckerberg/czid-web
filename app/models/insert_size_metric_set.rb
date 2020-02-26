class InsertSizeMetricSet < ApplicationRecord
  validates :pipeline_run_id, presence: true, numericality: :only_integer
  validates :median_insert_size, presence: true, numericality: :only_integer
  validates :mode_insert_size, presence: true, numericality: :only_integer
  validates :median_absolute_deviation, presence: true, numericality: :only_integer
  validates :min_insert_size, presence: true, numericality: :only_integer
  validates :max_insert_size, presence: true, numericality: :only_integer
  validates :mean_insert_size, presence: true, numericality: :true
  validates :standard_deviation, presence: true, numericality: :true
  validates :read_pairs, presence: true, numericality: :only_integer

  belongs_to :pipeline_run
end
