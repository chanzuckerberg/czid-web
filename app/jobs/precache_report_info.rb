class PrecacheReportInfo
  extend InstrumentedJob

  @queue = :precache_report_info

  def self.perform(pipeline_run_id)
    pr = PipelineRun.find(pipeline_run_id)
    pr.precache_report_info!
  rescue StandardError => err
    LogUtil.log_err(
      "PipelineRun #{pipeline_run_id} failed to precache report"
    )
    LogUtil.log_backtrace(err)
    raise err # Raise error in order to fire on_failure resque hook in InstrumentedJob
  end
end
