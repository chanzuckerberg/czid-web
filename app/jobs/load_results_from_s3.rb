# Jos to initiate database download
require 'resque/plugins/lock'
class LoadResultsFromS3
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  def self.lock(pipeline_run_id)
    "LoadResultsFromS3-#{pipeline_run_id}"
  end
  def self.perform(pipeline_run_id)
    pr =  PipelineRun.find(pipeline_run_id)
    pr.load_results_from_s3 unless pr.completed?
  end
end
