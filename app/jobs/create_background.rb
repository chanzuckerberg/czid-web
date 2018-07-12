class CreateBackground
  @queue = :q03_pipeline_run
  def self.perform(name, description, pipeline_run_ids)
    Background.create(name: name, description: description, pipeline_run_ids: pipeline_run_ids)
  rescue
    Airbrake.notify("Background creation failed: #{name}, #{description}, #{pipeline_run_ids}")
  end
end
