# Load a result from S3 into the db
class ResultMonitorLoader
  @queue = :q03_pipeline_run

  def self.perform(pipeline_run_id, output)
    Rails.logger.info("Loading #{output} for pipeline run #{pipeline_run_id}")
    pr = PipelineRun.find(pipeline_run_id)
    output_state = pr.output_states.find_by(output: output)
    begin
      output_state.update(state: PipelineRun::STATUS_LOADING)
      pr.send(PipelineRun::LOADERS_BY_OUTPUT[output])
      output_state.update(state: PipelineRun::STATUS_LOADED)
    rescue
      # wait for up to 30 seconds. mark as error and restart
      # TODO: revisit this
      sleep(Time.now.to_i % 30)
      output_state.update(state: PipelineRun::STATUS_LOADING_ERROR)
      LogUtil.log_err_and_airbrake("SampleFailedEvent: Pipeline Run #{pr.id} for Sample #{pr.sample.id} failed loading #{output}")
      raise
    end
  end
end
