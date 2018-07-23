class ComputeBackground
  @queue = :q03_pipeline_run
  def self.perform(background_id)
    Background.find(background_id).store_summary
  rescue
    Airbrake.notify("Background computation failed for background_id #{background_id}")
  end
end
