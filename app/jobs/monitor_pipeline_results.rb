require 'logger'
require 'resque/plugins/lock'
class MonitorPipelineResults
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform
    @logger.info("Checking results for active pipeline runs")
    PipelineRun.in_progress.each do |pr|
      @logger.info("Checking pipeline run #{pr.id} for sample #{pr.sample_id}")
      pr.monitor_results
    end
  end
end
