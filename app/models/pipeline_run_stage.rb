class PipelineRunStage < ApplicationRecord
  belongs_to :pipeline_run
  DEFAULT_MEMORY_IN_MB = 4000
  DEFAULT_STORAGE_IN_GB = 100
  JOB_TYPE_BATCH = 1

  def run_job
    job_command = self.send(job_command_func)
  end
  def run_load_db
    self.send(load_db_command_func)
  end

  def host_filtering_command
  end

  def alignment_command
  end

  def postprocess_command
  end


end
