# Jos to check the status of pipeline runs
require 'logger'

class CheckPipelineRuns
  @logger = Logger.new(STDOUT)

  # A fresh CheckPipelineRuns should run every 5 minutes.
  @cron_period = 5 * 60

  # Don't poll faster than this, in seconds.
  @min_refresh_interval = 20

  def self.time_padding_success
    5
  end

  def self.time_padding_failure
    15
  end

  def self.update_jobs(silent)
    PipelineRun.in_progress.each do |pr|
      @logger.info("  Checking pipeline run #{pr.id} for sample #{pr.sample_id}") unless silent
      pr.update_job_status
    end
  end

  def self.autoscaling_update(last_job_count)
    new_job_count = PipelineRun.in_progress.count
    return last_job_count if new_job_count == last_job_count
    if last_job_count.nil?
      @logger.info("Autoscaling update to #{new_job_count}.")
    else
      @logger.info("Autoscaling update from #{last_job_count} to #{new_job_count}.")
    end
    c_stdout, c_stderr, c_status = Open3.capture3("app/jobs/autoscaling.py update #{new_job_count} #{Rails.env}")
    @logger.info(c_stdout)
    @logger.error(c_stderr) unless c_status.success? && c_stderr.blank?
    new_job_count
  end

  def self.perform
    @logger.info("Checking the active pipeline runs every #{@min_refresh_interval} seconds over the next #{@cron_period / 60} minutes.")
    t_now = Time.now.to_f # unixtime
    t_end = t_now + @cron_period - self.time_padding_success
    autoscaling_state = nil
    max_work_duration = 0
    iter_count = 0
    loop do
      iter_count += 1
      t_iter_start = t_now
      update_jobs(iter_count != 1)
      autoscaling_state = autoscaling_update(autoscaling_state)
      t_now = Time.now.to_f
      max_work_duration = [t_now - t_iter_start, max_work_duration].max
      t_iter_end = [t_now, t_iter_start + @min_refresh_interval].max
      break unless t_iter_end + max_work_duration < t_end
      while t_now < t_iter_end do
        sleep t_iter_end - t_now
        t_now = Time.now.to_f
      end
    end
    @logger.info("Exited loop after #{iter_count} iterations.")
  end
end

task "pipeline_monitor", [:lifetype] => :environment do |t, args|
  if args[:lifetype] == "incarnation"
    CheckPipelineRuns.perform
  else
    # daemon
    loop do
      system("rake pipeline_monitor[incarnation]")
      if $?.exitstatus == 0
        sleep CheckPipelineRuns.time_padding_success
      else
        sleep CheckPipelineRuns.time_padding_failure
      end
    end
  end
end
