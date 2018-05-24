# Load a result from S3 into the db
require 'logger'
class ResultMonitorLoad
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)

  def self.perform(pipeline_run_id, load_db_command_func)
    @logger.info("#{load_db_command_func} for pipeline run #{pipeline_run_id}")
    pr = PipelineRun.find(pipeline_run_id)
    pr.send(load_db_command_func) unless pr.completed?
  end
end
