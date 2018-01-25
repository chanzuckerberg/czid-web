class GenerateProjectReportsCsv
  @queue = :q03_pipeline_run
  def self.perform(params)
    project = Project.find(params["id"])
    project.make_bulk_csv(params)
  end
end
