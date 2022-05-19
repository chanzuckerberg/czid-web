# Load a result from S3 into the db
class ResultMonitorLoader
  extend InstrumentedJob

  @queue = :result_monitor_loader

  # If we're using asynchronous notifications for pipeline updates and the pipeline has finished,
  # ResultMonitorLoader won't be called again, so we need to retry loading results here
  # if we encounter transient errors.
  MAX_ATTEMPTS = 5

  def self.perform(pipeline_run_id, output)
    pr = PipelineRun.find(pipeline_run_id)
    Rails.logger.info("Loading #{output} for pipeline run #{pipeline_run_id} (v#{pr.pipeline_version})")
    output_state = pr.output_states.find_by(output: output)

    if AppConfigHelper.get_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS) == "1"
      (1..MAX_ATTEMPTS).each do |attempt|
        output_state = load_output(pr, output, output_state)

        # If successful, break out of the retry loop.
        break
      rescue ActiveRecord::RecordNotUnique
        # We may potentially receive duplicate messages from our notification queue,
        # which can result in trying to load an output that already exists in our database.
        Rails.logger.warn("PipelineRun #{pipeline_run_id} has already loaded output #{output}")

        # The output has already been loaded, so break out of the retry loop.
        break
      rescue StandardError => e
        # Wait for up to 30 seconds. Mark as error and restart.
        sleep(Time.now.to_i % 30)
        output_state.update(state: PipelineRun::STATUS_LOADING_ERROR)
        message = "Pipeline Run #{pr.id} for Sample #{pr.sample.id} by #{pr.sample.user.role_name} failed loading #{output} with #{pr.adjusted_remaining_reads || 0} reads remaining after #{pr.duration_hrs} hours. See: #{pr.status_url}"
        LogUtil.log_error(message, exception: e)

        # If we've reached our max attempts, mark as failed and raise an error.
        if attempt == MAX_ATTEMPTS
          output_state.update(state: PipelineRun::STATUS_FAILED)
          message = "SampleFailedEvent: Pipeline Run #{pr.id} for Sample #{pr.sample.id} by #{pr.sample.user.role_name} failed loading #{output} with #{pr.adjusted_remaining_reads || 0} reads remaining after #{pr.duration_hrs} hours and #{MAX_ATTEMPTS} attempts. See: #{pr.status_url}"
          LogUtil.log_error(message, exception: e)

          finalize_pipeline_run_results(pr)
        end
      end
    else
      begin
        output_state = load_output(pr, output, output_state)
      rescue StandardError => e
        # wait for up to 30 seconds. mark as error and restart
        # TODO: revisit this
        sleep(Time.now.to_i % 30)
        output_state.update(state: PipelineRun::STATUS_LOADING_ERROR)
        message = "SampleFailedEvent: Pipeline Run #{pr.id} for Sample #{pr.sample.id} by #{pr.sample.user.role_name} failed loading #{output} with #{pr.adjusted_remaining_reads || 0} reads remaining after #{pr.duration_hrs} hours. See: #{pr.status_url}"
        LogUtil.log_error(message, exception: e)
        raise # Raise error in order to fire on_failure resque hook
      end
    end
  end

  def self.load_output(pipeline_run, output, output_state)
    output_state.update(state: PipelineRun::STATUS_LOADING)
    pipeline_run.send(PipelineRun::LOADERS_BY_OUTPUT[output])
    output_state.update(state: PipelineRun::STATUS_LOADED)

    if AppConfigHelper.get_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS) == "1"
      finalize_pipeline_run_results(pipeline_run)
    end

    output_state
  end

  def self.finalize_pipeline_run_results(pipeline_run)
    if pipeline_run.all_output_states_terminal?
      compiling_stats_error = pipeline_run.check_job_stats
      pipeline_run.finalize_results(compiling_stats_error)
    end
  end
end
