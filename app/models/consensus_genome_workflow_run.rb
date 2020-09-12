class ConsensusGenomeWorkflowRun < WorkflowRun
  def results
    {
      coverage_viz: coverage_viz,
      quality_metrics: quality_metrics,
      # TODO: Hardcoded as the only consensus genome for now
      taxon_name: "Severe acute respiratory syndrome coronavirus 2",
    }
  end

  private

  def coverage_viz
    ConsensusGenomeCoverageService.call(self)
  rescue => exception
    LogUtil.log_error(
      "Error loading coverage viz",
      exception: exception,
      details: {
        workflow_run_id: id,
      }
    )
    return nil
  end

  def quality_metrics
    ConsensusGenomeMetricsService.call(self)
  rescue => exception
    LogUtil.log_error(
      "Error loading quality metrics",
      exception: exception,
      details: {
        workflow_run_id: id,
      }
    )
    return nil
  end
end
