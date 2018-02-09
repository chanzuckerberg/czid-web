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
    @logger.info("Autoscaling update.")
    c_stdout, c_stderr, c_status = Open3.capture3("app/jobs/autoscaling.py update #{PipelineRun.in_progress.count} #{Rails.env}")
    @logger.info(c_stdout)
    @logger.error(c_stderr) unless c_status.success? && c_stderr.blank?
  end
end
