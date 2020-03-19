# frozen_string_literal: true

class UpdatePipelineRunStageService
  include Callable
  include ActiveModel::Validations

  attr_reader :pipeline_run_id, :stage_number, :job_status

  validates :pipeline_run_id, numericality: { only_integer: true }
  validates :job_status, inclusion: { in: %w[SUCCEEDED FAILED] }
  validates :stage_number, numericality: { only_integer: true }

  def initialize(pipeline_run_id, stage_number, job_status)
    @pipeline_run_id = pipeline_run_id
    @stage_number = stage_number
    @job_status = job_status
    validate!
  end

  def call
    prs = pipeline_run.pipeline_run_stages.find_by(step_number: stage_number)
    prs.update!(job_status: job_status)
    pipeline_run.async_update_job_status
  end

  def pipeline_run
    @pipeline_run ||= PipelineRun.find(pipeline_run_id)
  end
end
