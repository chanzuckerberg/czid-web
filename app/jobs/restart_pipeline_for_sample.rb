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
  rescue StandardError => err
    LogUtil.log_error(
      "RestartPipelineForSample #{sample_id} failed to run. Reason: #{err}",
      exception: err,
      sample_id: sample_id
    )
    raise err # Raise e in order to fire on_failure resque hook in InstrumentedJob
  end
end
