# Jos to check the status of pipeline runs
require 'logger'
require 'resque/plugins/lock'

Signal.trap("TERM") do
  CheckPipelineRuns.shutdown_requested = true
end

class CheckPipelineRuns
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)

  # A fresh CheckPipelineRuns should run every 5 minutes.
  # This should match resque_schedule.yml.
  @cron_period = 5 * 60
  @cron_drift = 5 # prevents small cron overlap

  # Don't poll faster than this, in seconds.
  @min_refresh_interval = 20

  # Wake up from sleep every this many seconds to check if we've been asked to shutdown
  @sigterm_poll_interval = 5.0

  @shutdown_requested = false

  def self.update_jobs(silent)
    PipelineRun.in_progress.each do |pr|
      break if @shutdown_requested
      @logger.info("  Checking pipeline run #{pr.id} for sample #{pr.sample_id}") unless silent
      pr.update_job_status
    end
  end

  def self.autoscaling_update(last_count)
    new_count = PipelineRun.in_progress.count
    return last_count if new_count == last_count
    if last_count.nil?
      @logger.info("Autoscaling update to #{new_count}.")
    else
      @logger.info("Autoscaling update from #{last_count} to #{new_count}.")
    end
    c_stdout, c_stderr, c_status = Open3.capture3("app/jobs/autoscaling.py update #{new_count} #{Rails.env}")
    @logger.info(c_stdout)
    @logger.error(c_stderr) unless c_status.success? && c_stderr.blank?
    new_count
  end

  def self.perform
    # Loop for up to cron_period - cron_drift seconds.
    @logger.info("Checking the active pipeline runs every #{@min_refresh_interval} seconds over the next #{@cron_period / 60} minutes.")
    t_now = Time.now.to_f # unixtime
    t_end = t_now + @cron_period - @cron_drift
    autoscaling_state = nil
    max_work_duration = 0
    iteration_count = 0
    out_of_time = false
    until @shutdown_requested || out_of_time
      iteration_count += 1
      t_iteration_start = t_now
      update_jobs(iteration_count != 1)
      autoscaling_state = autoscaling_update(autoscaling_state)
      t_now = Time.now.to_f
      max_work_duration = [t_now - t_iteration_start, max_work_duration].max
      t_iteration_end = [t_now, t_iteration_start + @min_refresh_interval].max
      out_of_time = t_iteration_end + max_work_duration > t_end
      unless out_of_time
        loop do
          wait_time = [t_iteration_end - t_now, sigterm_poll_interval].min
          break if wait_time <= 0 || @shutdown_requested
          sleep wait_time
          t_now = Time.now.to_f
        end
      end
    end
    reason = nil
    reason ||= "shutdown requested" if @shutdown_requsted
    reason ||= "fewer than #{max_work_duration} seconds remain until cron rebirth" if @out_of_time
    @logger.info("Exited loop after #{iteration_count} iterations because #{reason}.")
  end
end
