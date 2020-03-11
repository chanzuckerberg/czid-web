class UpdatePipelineRunStageService
  include Callable

  attr_reader :pipeline_run_id, :stage_number, :job_status

  def initialize(pipeline_run_id, stage_number, job_status)
    @pipeline_run_id = pipeline_run_id
    @stage_number = stage_number
    @job_status = job_status
  end

  def call
    pr = PipelineRun.find(@pipeline_run_id)
    pr_stages = pr.pipeline_run_stages.sort_by(:step_number)
    ActiveRecord::Base.transaction do
      # set previous states to succeeded if message arrives out of order
      pr_stages.where(step_number < stage_number) do |prs|
        unless pr_stages.succeeded?
          prs.update!(job_status: PipelineRunStage::STATUS_SUCCEEDED)
        end
      end
      pr_stages.find_by(step_number: stage_number).update!(job_status: job_status)
      pr.update_job_status
    end
  end
end
