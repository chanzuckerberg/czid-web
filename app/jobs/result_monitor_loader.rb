# Load a result from S3 into the db
class ResultMonitorLoader
  @queue = :q03_pipeline_run

  def self.perform(pipeline_run_id, output)
    Rails.logger.info("Loading #{output} for pipeline run #{pipeline_run_id}")
    pr = PipelineRun.find(pipeline_run_id)
    begin
      pr.update_result_status(output, PipelineRun::STATUS_LOADING_QUEUED, PipelineRun::STATUS_LOADING)
      pr.send(PipelineRun::LOADERS_BY_OUTPUT[output])
      pr.update_result_status(output, PipelineRun::STATUS_LOADING, PipelineRun::STATUS_LOADED)
    rescue
      pr.update_result_status(output, PipelineRun::STATUS_LOADING_QUEUED, PipelineRun::STATUS_FAILED)
      Airbrake.notify("Pipeline Run #{pr.id} failed loading #{output}")
      raise
    end
  end
end
