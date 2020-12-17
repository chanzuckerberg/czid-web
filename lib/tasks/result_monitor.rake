# Check for pipeline results and load them if available
require 'English'
require './lib/instrument'

class MonitorPipelineResults
  @sleep_quantum = 5.0

  @shutdown_requested = false

  class << self
    attr_accessor :shutdown_requested
  end

  def self.update_jobs
    instrumentation_namespace = "#{Rails.env}-result-monitor"
    Instrument.snippet(name: "Update Jobs", cloudwatch_namespace: instrumentation_namespace, extra_dimensions: [{ name: "Monitor Type", value: "Result Monitor" }]) do
      Instrument.snippet(name: "Pipeline Run Loop", cloudwatch_namespace: instrumentation_namespace) do
        PipelineRun.results_in_progress.each do |pr|
          break if @shutdown_requested

          Rails.logger.info("Monitoring results: pipeline run #{pr.id}, sample #{pr.sample_id}")
          pr.monitor_results
        rescue StandardError => exception
          LogUtil.log_error(
            "Failed monitor results for pipeline run #{pr.id}: #{exception.message}",
            exception: exception,
            pipeline_run_id: pr.id
          )
        end
      end

      Instrument.snippet(name: "PhyloTree Loop", cloudwatch_namespace: instrumentation_namespace) do
        PhyloTree.in_progress.each do |pt|
          break if @shutdown_requested

          Rails.logger.info("Monitoring results for phylo_tree #{pt.id}")
          pt.monitor_results
        rescue StandardError => exception
          LogUtil.log_error(
            "Failed monitor results for phylo_tree #{pt.id}: #{exception.message}",
            exception: exception,
            phylo_tree_id: pt.id
          )
        end
      end

      Instrument.snippet(name: "Failed/Stalled Uploads", cloudwatch_namespace: instrumentation_namespace) do
        # "stalled uploads" are not pipeline jobs, but they fit in here better than
        # anywhere else.
        begin
          MonitorPipelineResults.alert_stalled_uploads!
        rescue StandardError => exception
          LogUtil.log_error("Failed to alert on stalled uploads: #{exception.message}", exception: exception)
        end

        begin
          MonitorPipelineResults.fail_stalled_uploads!
        rescue StandardError => exception
          LogUtil.log_error("Failed to fail stalled uploads: #{exception.message}", exception: exception)
        end
      end
    end
  end

  def self.fail_stalled_uploads!
    samples = Sample.current_stalled_local_uploads(18.hours)
    unless samples.empty?
      Rails.logger.error(
        "SampleFailedEvent: Failed to upload local samples after 18 hours #{samples.pluck(:id)}"
      )
      samples.update_all( # rubocop:disable Rails/SkipsModelValidations
        status: Sample::STATUS_CHECKED,
        upload_error: Sample::UPLOAD_ERROR_LOCAL_UPLOAD_FAILED
      )
      WorkflowRun.handle_sample_upload_failure(samples)
    end
  end

  def self.alert_stalled_uploads!
    # Delay determined based on query of historical upload times, where 80%
    # of successful uploads took less than 3 hours by client_updated_at.
    samples = Sample.current_stalled_local_uploads(3.hours).where(upload_error: nil)
    if samples.empty?
      return
    end

    created_at = samples.map(&:created_at).max
    role_names = samples.map { |sample| sample.user.role_name }.compact.uniq
    project_names = samples.map { |sample| sample.project.name }.compact.uniq
    duration_hrs = ((Time.now.utc - created_at) / 60 / 60).round(2)
    client_updated_at = samples.map(&:client_updated_at).compact.max
    status_urls = samples.map(&:status_url)
    msg = %(LongRunningUploadsEvent: #{samples.length} samples were created more than #{duration_hrs} hours ago by #{role_names} in projects #{project_names}.
      #{client_updated_at ? "Last client ping was at #{client_updated_at}. " : ''} See: #{status_urls})
    Rails.logger.info(msg)

    samples.update_all(upload_error: Sample::UPLOAD_ERROR_LOCAL_UPLOAD_STALLED) # rubocop:disable Rails/SkipsModelValidations
  end

  def self.run(duration, min_refresh_interval)
    Rails.logger.info("Monitoring results for the active pipeline runs every #{min_refresh_interval} seconds over the next #{duration / 60} minutes.")
    t_now = Time.now.to_f # unixtime
    # Will try to return as soon as duration seconds have elapsed, but not any sooner.
    t_end = t_now + duration
    # The duration of the longest update so far.
    max_work_duration = 0
    iter_count = 0
    until @shutdown_requested
      iter_count += 1
      t_iter_start = t_now
      update_jobs()
      t_now = Time.now.to_f
      max_work_duration = [t_now - t_iter_start, max_work_duration].max
      t_iter_end = [t_now, t_iter_start + min_refresh_interval].max
      break unless t_iter_end + max_work_duration < t_end

      while t_now < t_iter_end && !@shutdown_requested
        # Ensure no iteration is shorter than min_refresh_interval.
        sleep [t_iter_end - t_now, @sleep_quantum].min
        t_now = Time.now.to_f
      end
    end
    while t_now < t_end && !@shutdown_requested
      # In this case (t_end - t_now) < max_work_duration.
      sleep [t_end - t_now, @sleep_quantum].min
      t_now = Time.now.to_f
    end
    Rails.logger.info("Exited result_monitor loop after #{iter_count} iterations.")
  end
end

task "result_monitor", [:duration] => :environment do |_t, args|
  trap('SIGTERM') do
    MonitorPipelineResults.shutdown_requested = true
  end
  # spawn a new finite duration process every 60 minutes
  respawn_interval = 60 * 60
  # rate-limit status updates
  cloud_env = ["prod", "staging"].include?(Rails.env)
  checks_per_minute = cloud_env ? 4.0 : 0.2
  # make sure the system is not overwhelmed under any cirmustances
  wait_before_respawn = cloud_env ? 5 : 30
  additional_wait_after_failure = 25

  # don't show all the SQL debug info in the logs
  Rails.logger.level = [1, Rails.logger.level].max

  if args[:duration] == "single_iteration"
    MonitorPipelineResults.run(0, 60.0 / checks_per_minute)
  elsif args[:duration] == "finite_duration"
    MonitorPipelineResults.run(respawn_interval - wait_before_respawn, 60.0 / checks_per_minute)
  else
    # infinite duration
    # HACK
    Rails.logger.info("HACK: Sleeping 30 seconds on daemon startup for prior incarnations to drain.")
    sleep 30
    until MonitorPipelineResults.shutdown_requested
      system("rake result_monitor[finite_duration]")
      sleep wait_before_respawn
      unless $CHILD_STATUS.exitstatus.zero?
        sleep additional_wait_after_failure
      end
    end
  end
end

# One-off task for testing alerts
task "alert_stalled_uploads", [] => :environment do
  MonitorPipelineResults.alert_stalled_uploads!
end

# One-off task for testing failures
task "fail_stalled_uploads", [] => :environment do
  MonitorPipelineResults.fail_stalled_uploads!
end
