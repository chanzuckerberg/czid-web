# Jos to initiate database download
require 'resque/plugins/lock'
class LoadResultsFromS3
  extend InstrumentedJob
  extend Resque::Plugins::Lock

  @queue = :q03_pipeline_run
  @git_version = ENV['GIT_VERSION'] || ""

  def self.lock(pipeline_run_id)
    "LoadResultsFromS3-#{pipeline_run_id}-#{@git_version}"
  end

  def self.perform(pipeline_run_id)
    Rails.logger.info("load pipeline run #{pipeline_run_id} into database")
    pr = PipelineRun.find(pipeline_run_id)
    pr.load_results_from_s3 unless pr.completed?
  end
end
