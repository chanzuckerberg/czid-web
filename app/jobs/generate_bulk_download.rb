# Job to generate a bulk download
class GenerateBulkDownload
  @queue = :generate_bulk_download
  def self.perform(bulk_download_id)
    Rails.logger.info("Start generating bulk download #{bulk_download_id}")
    BulkDownload.find(bulk_download_id).generate_download_file
  rescue => e
    failure_message = "Bulk download generation failed for id #{bulk_download_id}: #{e}"
    LogUtil.log_backtrace(e)
    LogUtil.log_err_and_airbrake(failure_message)
  end
end
