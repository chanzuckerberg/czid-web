# Job to initiate sync from prod/staging s3 to staging/development s3
class InitiateS3EnvSync
  @queue = :q03_pipeline_run
  def self.perform(sample_id, from_env)
    sample = Sample.find(sample_id)
    Rails.logger.info("Syncing #{from_env} files for sample #{sample.id}")
    sample.initiate_s3_env_sync(from_env)
  end
end
