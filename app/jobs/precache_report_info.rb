class PrecacheReportInfo
  @queue = :precache_report_info

  def self.perform(pipeline_run_id)
    pr = PipelineRun.find(pipeline_run_id)
    pr.precache_report_info!
  rescue => err
    LogUtil.log_err_and_airbrake(
      "PipelineRun #{pipeline_run_id} failed to precache report"
    )
    LogUtil.log_backtrace(err)
  end
end
