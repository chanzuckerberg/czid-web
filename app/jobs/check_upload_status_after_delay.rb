# Job to warn on bad upload
class CheckUploadStatusAfterDelay
  @queue = :check_upload_status_after_delay

  def self.perform(sample_id, minutes)
    sample = Sample.find(sample_id)
    Rails.logger.info("Checking upload status of sample #{sample.id}")

    if sample.status == 'created' &&
       (Time.current - created_at).minutes > minutes
      duration_hrs = Time.current - sample.created_at
      msg = "LongRunningUploadEvent: Sample #{sample.id} by #{sample.user.role_name} " \
        "was created #{duration_hrs} hours ago. " \
        "#{sample.input_files || 0} input files have been uploaded. " \
        "Last client ping was at #{sample.client_updated_at}. See: #{status_url}"
      LogUtil.log_err_and_airbrake(msg)
    end
  end
end
