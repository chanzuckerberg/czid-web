class ConsensusGenomeWorkflowRun < WorkflowRun
  def results
    {
      coverage_viz: coverage_viz,
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
end
