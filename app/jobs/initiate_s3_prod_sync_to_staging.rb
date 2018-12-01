# Job to initiate sync from prod s3 to staging s3
class InitiateS3ProdSyncToStaging
  @queue = :q03_pipeline_run
  def self.perform(sample_id)
    sample = Sample.find(sample_id)
    Rails.logger.info("Syncing prod files for sample #{sample.id}")
    sample.initiate_s3_prod_sync_to_staging
  end
end
