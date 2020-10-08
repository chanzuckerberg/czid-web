# Load a result from S3 into the db
class ResultMonitorLoader
  extend InstrumentedJob

  @queue = :result_monitor_loader

  def self.perform(pipeline_run_id, output)
    pr = PipelineRun.find(pipeline_run_id)
    Rails.logger.info("Loading #{output} for pipeline run #{pipeline_run_id} (v#{pr.pipeline_version})")
    output_state = pr.output_states.find_by(output: output)
    begin
      output_state.update(state: PipelineRun::STATUS_LOADING)
      pr.send(PipelineRun::LOADERS_BY_OUTPUT[output])
      output_state.update(state: PipelineRun::STATUS_LOADED)
    rescue StandardError
      # wait for up to 30 seconds. mark as error and restart
      # TODO: revisit this
      sleep(Time.now.to_i % 30)
      output_state.update(state: PipelineRun::STATUS_LOADING_ERROR)
      message = "SampleFailedEvent: Pipeline Run #{pr.id} for Sample #{pr.sample.id} by #{pr.sample.user.email} failed loading #{output} with #{pr.adjusted_remaining_reads || 0} reads remaining after #{pr.duration_hrs} hours. See: #{pr.status_url}"
      Rails.logger.error(message)
      raise # Raise error in order to fire on_failure resque hook
    end
  end
end
