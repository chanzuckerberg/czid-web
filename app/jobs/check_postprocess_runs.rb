require 'logger'
require 'resque/plugins/lock'
class CheckPostprocessRuns
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform
    @logger.info("Checking the active postprocess runs")
    PostprocessRun.in_progress.each do |pr|
      @logger.info("  Checking postprocess run #{pr.id} for pipeline_output #{pr.pipeline_output_id}")
      pr.update_job_status
    end
  end
end
