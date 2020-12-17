# Job to generate a bulk download
class GenerateBulkDownload
  extend InstrumentedJob

  @queue = :generate_bulk_download
  def self.perform(bulk_download_id)
    BulkDownload.find(bulk_download_id).generate_download_file
  rescue StandardError => err
    LogUtil.log_error("Bulk download generation failed for id #{bulk_download_id}: #{err}", exception: err, bulk_download_id: bulk_download_id)
    raise err # Raise error in order to fire on_failure resque hook in InstrumentedJob
  end
end
