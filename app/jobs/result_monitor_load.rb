# Load a result from S3 into the db
require 'logger'
class ResultMonitorLoad
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)

  def self.perform(pipeline_run_id, load_db_command_func, loaded_status)
    @logger.info("#{load_db_command_func} for pipeline run #{pipeline_run_id}")
    pr = PipelineRun.find(pipeline_run_id)
    begin
      pr.send(load_db_command_func) unless pr.completed?
      send(load_db_command_func)
      pr.update(job_status: loaded_status)
    rescue
      pr.update(job_status: PipelineRun::STATUS_FAILED)
      Airbrake.notify("Pipeline Run #{pr.id} failed #{load_db_command_func}")
      raise
    end
  end
end
