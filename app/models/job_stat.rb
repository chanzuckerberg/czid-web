class JobStat < ApplicationRecord
  belongs_to :pipeline_run
  validates :pipeline_run, presence: true, if: :mass_validation_enabled?
  validates :task, presence: true, inclusion: { in: PipelineRunsHelper::ALL_STEP_NAMES }, if: :mass_validation_enabled?
  validates :reads_before, numericality: { greater_than_or_equal_to: 0 }, if: :mass_validation_enabled?
  validates :reads_after, numericality: { greater_than_or_equal_to: 0 }, if: :mass_validation_enabled?
end
