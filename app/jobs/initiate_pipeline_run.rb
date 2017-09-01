# Jos to initiate idseq pipeline
require 'logger'
class InitiatePipelineRun
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform(seconds)
    # placeholder. trigger the toil pipeline from here.
    (1..seconds).each do |sec|
      @logger.info("#{sec} passed")
      sleep 1
    end
  end
end
