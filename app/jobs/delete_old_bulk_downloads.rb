# Auto deletion for BulkDownload records over age of BulkDownload::AUTO_DELETE_AFTER_NUM_DAYS.
# BulkDownload model has a `cleanup_s3` method on after_destroy callback to delete files.
# Expectatation is this a scheduled job that we run nightly for clean up.
# See CZID-9274 if you need more info on purpose of job.
class DeleteOldBulkDownloads
  extend InstrumentedJob

  @queue = :delete_old_bulk_downloads

  BATCH_SIZE = 100
  SECONDS_OF_DELAY_BETWEEN_BATCHES = 1

  NextGenDeleteBulkDownloads = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation {
      deleteOldBulkDownloads {
        id
      }
    }
  GRAPHQL

  def self.perform
    Rails.logger.info("Starting DeleteOldBulkDownloads job.")
    if AppConfigHelper.get_app_config(AppConfig::AUTO_DELETE_OLD_BULK_DOWNLOADS) == "1"
      destroy_old_downloads
      destroy_old_downloads_nextgen
    else
      Rails.logger.info("Auto-deletion of BulkDownloads is not currently enabled. See AppConfig.")
    end
    Rails.logger.info("Finished DeleteOldBulkDownloads job.")
  rescue StandardError => e
    LogUtil.log_error(
      "Unexpected error encountered during DeleteOldBulkDownloads job.",
      exception: e
    )
    raise e
  end

  # Effectively the "real" `perform` method of the job.
  # It's just separated out to clarify the pre-flight check for app config being enabled.
  def self.destroy_old_downloads
    Rails.logger.info("There are currently #{BulkDownload.count} BulkDownload records.")
    Rails.logger.info("Going to delete all BulkDownloads older than #{BulkDownload::AUTO_DELETE_AFTER_NUM_DAYS} days.")
    bulk_download_deletion_query = BulkDownload.where(
      "created_at < ?", Time.now.utc - BulkDownload::AUTO_DELETE_AFTER_NUM_DAYS.days
    )
    count_of_bds_to_delete = bulk_download_deletion_query.count
    Rails.logger.info("Will delete #{count_of_bds_to_delete} BulkDownload records due to age.")

    successfully_deleted_count = 0
    failed_bulk_download_ids = []
    Rails.logger.info("Deleting BulkDownloads in batches of #{BATCH_SIZE}.")
    current_batch = 0
    total_batches = (count_of_bds_to_delete.to_f / BATCH_SIZE).ceil

    bulk_download_deletion_query.in_batches(of: BATCH_SIZE) do |bulk_downloads|
      bulk_downloads.each do |bulk_download|  # Do via `each` to trigger destroy callback
        if destory_bulk_download_with_retries(bulk_download)
          successfully_deleted_count += 1
        else
          failed_bulk_download_ids << bulk_download.id
        end
      end
      current_batch += 1
      Rails.logger.info("Destroyed batch #{current_batch} out of #{total_batches}")
      sleep SECONDS_OF_DELAY_BETWEEN_BATCHES  # Throttle DB interaction because bulk usage
    end

    Rails.logger.info("Successfully deleted #{successfully_deleted_count} BulkDownload records.")
    unless failed_bulk_download_ids.empty?
      Rails.logger.error("Failed to delete BulkDownloads with ids: #{failed_bulk_download_ids.join(', ')}.")
    end
  end

  def self.destroy_old_downloads_nextgen
    Rails.logger.info("Starting DeleteOldBulkDownloads job for NextGen bulk downloads.")

    # Delete old bulk downloads
    system_user_id = ENV["SYSTEM_ADMIN_USER_ID"]
    CzidGraphqlFederation.query_with_token(system_user_id, NextGenDeleteBulkDownloads)
  end

  # Destroy a single bulk_download record with retry logic in case something goes wrong.
  # Likely trying to be unnecessarily robust here, but seems slightly better to avoid
  # pinging on-call eng in case of a one-off hiccup with DB or S3 interaction.
  # Based on the `delete_object_with_retries` method from HardDeleteObjects job.
  def self.destory_bulk_download_with_retries(bulk_download)
    deletion_attempts = 3

    (1..deletion_attempts).each do |attempt_number|
      bulk_download.destroy!
      return true
    rescue StandardError => e
      if attempt_number == deletion_attempts
        LogUtil.log_error(
          "BulkDownload auto-deletion error while destroying id=#{bulk_download.id}. Tried #{deletion_attempts} attempts. Giving up.",
          exception: e,
          bulk_download_id: bulk_download.id
        )
        return false
      else
        Rails.logger.info("Error while destroying BulkDownload id=#{bulk_download.id} after #{attempt_number} attempts. Error: `#{e}`. Will retry.")
        # Exponential backoff for next try. Mostly to keep AWS happy if that's where error was.
        sleep(2**(attempt_number - 1))
      end
    end
  end
end
