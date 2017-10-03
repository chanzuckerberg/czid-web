# Jos to initiate database download
require 'logger'
require 'resque/plugins/lock'
class LoadResultsFromS3
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.lock(pipeline_run_id)
    "LoadResultsFromS3-#{pipeline_run_id}"
  end

  def self.perform(pipeline_run_id)
    @logger.info("load pipeline run #{pipeline_run_id} into database")
    pr = PipelineRun.find(pipeline_run_id)
    pr.load_results_from_s3 unless pr.completed?
  end
end
