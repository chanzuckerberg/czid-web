# Over time, the Resque failure queue can grow very large
# and can cause Redis to crash if it runs out of space on disk.
# This job removes failures from the Resque failure queue that are older than 7 days.
class ClearResqueFailureQueue
  extend InstrumentedJob
  @queue = :clear_resque_failure_queue
  MAX_JOB_LIMIT = 1000
  TOO_MANY_FAILED_JOBS_MESSAGE = "Resque failure count is over #{MAX_JOB_LIMIT}.".freeze
  FAILED_TO_REMOVE_JOB_MESSAGE = "Failed to delete some jobs from Resque failure queue.".freeze

  def self.perform
    current_time = Time.now.utc
    threshold_time = current_time - 7.days
    job_counts = {}
    jobs_cleared = 0
    jobs_errored_during_clear = {}

    Rails.logger.info("Starting to clear Resque failures older than #{threshold_time}")

    if Resque::Failure.count > MAX_JOB_LIMIT
      LogUtil.log_error(
        "#{TOO_MANY_FAILED_JOBS_MESSAGE}. Please investigate source of failures and clear using the Resque UI.",
        exception: StandardError.new(TOO_MANY_FAILED_JOBS_MESSAGE)
      )
    end

    Resque::Failure.each do |id, job|
      failed_at = Time.parse(job['failed_at']).utc
      if failed_at < threshold_time
        job_counts[job["payload"]["class"]] ||= 0
        job_counts[job["payload"]["class"]] += 1
        jobs_cleared += 1
        Resque::Failure.remove(id)
      end
    rescue StandardError => e
      LogUtil.log_error("Failed to clear Resque job with id #{id}", exception: e)
      jobs_errored_during_clear[id] = job
    end

    LogUtil.log_message("Resque failures by job class: #{job_counts.to_json}")
    LogUtil.log_message("Cleared #{jobs_cleared} failures")
    unless jobs_errored_during_clear.empty?
      LogUtil.log_error(
        FAILED_TO_REMOVE_JOB_MESSAGE,
        exception: StandardError.new(FAILED_TO_REMOVE_JOB_MESSAGE),
        jobs_errored_during_clear: jobs_errored_during_clear
      )
    end
  end
end
