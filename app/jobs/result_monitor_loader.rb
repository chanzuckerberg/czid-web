# Load a result from S3 into the db
class ResultMonitorLoader
  @queue = :q03_pipeline_run

  def self.perform(pipeline_run_id, output)
    Rails.logger.info("Loading #{output} for pipeline run #{pipeline_run_id}")
    pr = PipelineRun.find(pipeline_run_id)
    if pr.result_status_for(output) != PipelineRun::STATUS_LOADING_QUEUED
      Rails.logger.warn("Aborting #{output} loading for pipeline run #{pipeline_run_id} " \
                        "because status was not #{PipelineRun::STATUS_LOADING_QUEUED}")
      return
    end
    begin
      pr.update_result_status(output, PipelineRun::STATUS_LOADING)
      pr.send(PipelineRun::LOADERS_BY_OUTPUT[output])
      pr.update_result_status(output, PipelineRun::STATUS_LOADED)
    rescue
      pr.update_result_status(output, PipelineRun::STATUS_FAILED)
      pr.update(results_finalized: 1)
      Airbrake.notify("Pipeline Run #{pr.id} failed loading #{output}")
      raise
    end
  end
end
