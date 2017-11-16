# Jos to initiate database download
require 'logger'
require 'resque/plugins/lock'
class LoadResultForRunStage
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.lock(_pipeline_run_stage_id)
    "LoadResultsFromS3-#{pipeline_run_id}"
  end

  def self.perform(pipeline_run_stage_id)
    @logger.info("load pipeline run stage #{pipeline_run_stage_id} into database")
    prs = PipelineRunStage.find(pipeline_run_stage_id)
    prs.run_load_db unless prs.completed?
  end
end
