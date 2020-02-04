# Job to initiate s3 copy
class InitiateS3Cp
  @queue = :initiate_s3_cp
  def self.perform(sample_id)
    sample = Sample.find(sample_id)
    Rails.logger.info("Start copying sample #{sample.id}")
    output = sample.initiate_s3_cp
    Rails.logger.info(output)
  end
end
