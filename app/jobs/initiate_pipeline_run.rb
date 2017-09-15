# Jos to initiate idseq pipeline
require 'logger'
class InitiatePipelineRun
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform(sample_id)
    sample = Sample.find(sample_id)
    output = sample.kickoff_pipeline # dryrun only
    @logger.info(output)
  end
end
