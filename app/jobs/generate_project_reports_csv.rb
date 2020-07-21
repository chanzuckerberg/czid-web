class GenerateProjectReportsCsv
  extend InstrumentedJob

  @queue = :q03_pipeline_run
  def self.perform(params)
    params = HashWithIndifferentAccess.new(params)
    project = Project.find(params["id"])
    project.bulk_report_csvs_from_params(params)
  end
end
