class ConsensusGenomeWorkflowRun < WorkflowRun
  def results
    {
      coverage_viz: coverage_viz,
      quality_metrics: quality_metrics,
      taxon_info: taxon_info,
    }
  end

  private

  def coverage_viz
    ConsensusGenomeCoverageService.call(self)
  rescue => exception
    LogUtil.log_error(
      "Error loading coverage viz",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  def quality_metrics
    ConsensusGenomeMetricsService.call(self)
  rescue => exception
    LogUtil.log_error(
      "Error loading quality metrics",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  def taxon_info
    # TODO: Hardcoded as the only consensus genome for now
    return {
      accession_id: "MN985325.1",
      accession_name: "Severe acute respiratory syndrome coronavirus 2 isolate SARS-CoV-2/human/USA/WA-CDC-WA1/2020, complete genome",
      taxon_id: 2_697_049,
      taxon_name: "Severe acute respiratory syndrome coronavirus 2",
    }
  end
end
