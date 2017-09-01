# Jos to initiate idseq pipeline
class InitiatePipelineRun
  @queue = :q03_pipeline_run
  def self.perform(seconds)
    # placeholder. trigger the toil pipeline from here.
    (1..seconds).each do |sec|
      puts sec
      sleep 1
    end
  end
end
