class ComputeBackground
  @queue = :q03_pipeline_run
  def self.perform(background_id)
    Background.find(background_id).store_summary
  rescue
    LogHelper.log_err_and_notify("Background computation failed for background_id #{background_id}")
  end
end
