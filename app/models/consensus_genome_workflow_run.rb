class ConsensusGenomeWorkflowRun < WorkflowRun
  OUTPUT_DEPTHS = "consensus_genome.compute_stats_out_sam_depths".freeze
  OUTPUT_QUAST = "consensus_genome.quast_out_quast_tsv".freeze
  OUTPUT_STATS = "consensus_genome.compute_stats_out_output_stats".freeze
  OUTPUT_ZIP = "consensus_genome.zip_outputs_out_output_zip".freeze

  # cacheable_only results will be stored in the db.
  # Full results will fetch from S3 (a superset of cached results).
  def results(cacheable_only: false)
    {
      coverage_viz: coverage_viz(cacheable_only: cacheable_only),
      quality_metrics: quality_metrics,
      taxon_info: taxon_info,
    }
  end

  private

  def coverage_viz(cacheable_only: false)
    ConsensusGenomeCoverageService.call(workflow_run: self, cacheable_only: cacheable_only)
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
