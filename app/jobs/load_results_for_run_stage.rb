# Jos to initiate database download
require 'logger'
require 'resque/plugins/lock'
class LoadResultForRunStage
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  @git_version = ENV['GIT_VERSION'] || ""

  def self.lock(pipeline_run_stage_id)
    "LoadResultsFromS3-#{pipeline_run_stage_id}-#{@git_version}"
  end

  def self.perform(pipeline_run_stage_id)
    @logger.info("load pipeline run stage #{pipeline_run_stage_id} into database")
    prs = PipelineRunStage.find(pipeline_run_stage_id)
    unless prs.completed?
      prs.run_load_db
      # Send email when last sample in project completes successfully
      pr = prs.pipeline_run
      prs_count = pipeline_run.pipeline_run_stages.count
      pr.notify_users if prs.step_number == prs_count && pr.notify?
    end
  end
end
