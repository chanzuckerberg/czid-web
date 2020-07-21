# Job to generate a bulk download
class GenerateBulkDownload
  extend InstrumentedJob

  @queue = :generate_bulk_download
  def self.perform(bulk_download_id)
    BulkDownload.find(bulk_download_id).generate_download_file
  rescue => err
    LogUtil.log_backtrace(err)
    LogUtil.log_err_and_airbrake("Bulk download generation failed for id #{bulk_download_id}: #{err}")
    raise err # Raise error in order to fire on_failure resque hook in InstrumentedJob
  end
end
