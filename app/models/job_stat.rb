class JobStat < ApplicationRecord
  belongs_to :pipeline_run
  validates :pipeline_run, presence: true
  validates :task, presence: true, inclusion: { in: PipelineRunsHelper::ALL_STEP_NAMES }
  validates :reads_before, numericality: { greater_than: 0 }
  validates :reads_after, numericality: { greater_than: 0 }
end
