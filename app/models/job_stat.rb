class JobStat < ApplicationRecord
  belongs_to :pipeline_run
  validates :pipeline_run, presence: true
  validates :task, presence: true
  validates :reads_after, numericality: { greater_than_or_equal_to: 0 }
end
