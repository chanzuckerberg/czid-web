# Job to initiate s3 copy
class InitiateS3Cp
  extend InstrumentedJob

  @queue = :initiate_fastq_files_s3_cp
  def self.perform(sample_id, unlimited_size = false)
    sample = Sample.find(sample_id)
    Rails.logger.info("Start copying sample #{sample.id}")
    output = sample.initiate_fastq_files_s3_cp(unlimited_size)
    Rails.logger.info(output)

    WorkflowRun.handle_sample_upload_restart(sample)
  end
end
