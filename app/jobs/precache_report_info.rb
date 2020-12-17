class PrecacheReportInfo
  extend InstrumentedJob

  @queue = :precache_report_info

  def self.perform(pipeline_run_id)
    pr = PipelineRun.find(pipeline_run_id)
    pr.precache_report_info!
  rescue StandardError => err
    LogUtil.log_error(
      "PipelineRun #{pipeline_run_id} failed to precache report",
      exception: err,
      pipeline_run_id: pipeline_run_id
    )
    raise err # Raise error in order to fire on_failure resque hook in InstrumentedJob
  end
end
