require 'resque/plugins/lock'
class LoadPostprocessFromS3
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @git_version = ENV['GIT_VERSION'] || ""
  def self.lock(pipeline_run_id)
    "LoadPostprocessFromS3-#{pipeline_run_id}-#{@git_version}"
  end

  def self.perform(pipeline_run_id)
    Rails.logger.info("load postprocessing results for pipeline run #{pipeline_run_id} into database")
    pr = PipelineRun.find(pipeline_run_id)
    pr.load_postprocess_from_s3
  end
end
