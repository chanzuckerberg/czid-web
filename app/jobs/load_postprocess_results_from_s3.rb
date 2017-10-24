require 'logger'
require 'resque/plugins/lock'
class LoadPostprocessResultsFromS3
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.lock(postprocess_run_id)
    "LoadPostprocessResultsFromS3-#{postprocess_run_id}"
  end

  def self.perform(postprocess_run_id)
    @logger.info("load postprocess run #{postprocess_run_id} into database")
    pr = PostprocessRun.find(postprocess_run_id)
    pr.load_results_from_s3 unless pr.completed?
  end
end
