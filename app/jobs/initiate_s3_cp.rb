# Jos to initiate s3 copy
require 'logger'
class InitiateS3Cp
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform(sample_id)
    sample = Sample.find(sample_id)
    @logger.info("Start copying sample #{sample.id}")
    output = sample.initiate_s3_cp
    @logger.info(output)
  end
end