class OutputState < ApplicationRecord
  belongs_to :pipeline_run
  validates :pipeline_run, presence: true

  validates :state, inclusion: { in: [
    PipelineRun::STATUS_LOADED,
    PipelineRun::STATUS_UNKNOWN,
    PipelineRun::STATUS_LOADING,
    PipelineRun::STATUS_LOADING_QUEUED,
    PipelineRun::STATUS_LOADING_ERROR,
  ], }
end
