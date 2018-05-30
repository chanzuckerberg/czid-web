# Load a result from S3 into the db
require 'logger'
class ResultMonitorLoader
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)

  def self.perform(pipeline_run_id, load_db_command_func)
    @logger.info("#{load_db_command_func} for pipeline run #{pipeline_run_id}")
    pr = PipelineRun.find(pipeline_run_id)
    begin
      pr.send(load_db_command_func) unless pr.completed?
      pr.update_result_status(load_db_command_func, PipelineRun::STATUS_LOADED)
    rescue
      pr.update_result_status(load_db_command_func, PipelineRun::STATUS_FAILED)
      Airbrake.notify("Pipeline Run #{pr.id} failed #{load_db_command_func}")
      raise
    end
  end
end
