require 'logger'
require 'resque/plugins/lock'
class LoadPostprocessFromS3
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.lock(pipeline_run_id)
    "LoadPostprocessFromS3-#{pipeline_run_id}"
  end

  def self.perform(pipeline_run_id)
    @logger.info("load postprocessing results for pipeline run #{pipeline_run_id} into database")
    pr = PipelineRun.find(pipeline_run_id)
    pr.load_postprocess_from_s3
  end
end
