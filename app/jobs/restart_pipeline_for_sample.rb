class RestartPipelineForSample
  extend InstrumentedJob

  @queue = :q03_pipeline_run

  def self.perform(sample_id)
    s = Sample.find(sample_id)
    if s.nil?
      raise "Sample #{sample_id} not found"
    end
    Rails.logger.info("RestartPipelineForSample #{sample_id} is being triggered")
    raise "not restarted" unless s.kickoff_pipeline
    Rails.logger.info("RestartPipelineForSample #{sample_id} has started. ")
  rescue => err
    LogUtil.log_err_and_airbrake(
      "RestartPipelineForSample #{sample_id} failed to run. Reason: #{err}"
    )
    LogUtil.log_backtrace(err)
    raise err # Raise e in order to fire on_failure resque hook in InstrumentedJob
  end
end
