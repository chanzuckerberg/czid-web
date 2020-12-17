class ComputeBackground
  extend InstrumentedJob

  @queue = :q03_pipeline_run
  def self.perform(background_id)
    Background.find(background_id).store_summary
  rescue StandardError
    LogUtil.log_error("Background computation failed for background_id #{background_id}", background_id: background_id)
    raise # Raise error in order to fire on_failure resque hook in InstrumentedJob
  end
end
