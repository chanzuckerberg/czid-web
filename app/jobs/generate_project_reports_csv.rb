class GenerateProjectReportsCsv
  @queue = :q03_pipeline_run
  def self.perform(params)
    project = Project.find(params["id"])
    bulk_report_csvs_from_params(project, params)
  end
end
