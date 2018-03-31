# Jos to initiate database download
require 'logger'
class LoadResultForRunStage
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)

  def self.perform(pipeline_run_stage_id)
    @logger.info("load pipeline run stage #{pipeline_run_stage_id} into database")
    prs = PipelineRunStage.find(pipeline_run_stage_id)
    prs.run_load_db unless prs.completed?
  end
end
