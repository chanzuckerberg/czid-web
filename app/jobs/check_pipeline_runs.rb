# Jos to check the status of pipeline runs
require 'logger'
require 'resque/plugins/lock'
class CheckPipelineRuns
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform
    @logger.info("Checking the active pipeline runs")
    PipelineRun.in_progress.each do |pr|
      @logger.info("  Checking pipeline run #{pr.id} for sample #{pr.sample_id}")
      pr.update_job_status
    end
  end
end
