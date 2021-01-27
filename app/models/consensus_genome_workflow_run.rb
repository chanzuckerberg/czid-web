class ConsensusGenomeWorkflowRun < WorkflowRun
  OUTPUT_DEPTHS = "consensus_genome.compute_stats_out_sam_depths".freeze
  OUTPUT_QUAST = "consensus_genome.quast_out_quast_tsv".freeze
  OUTPUT_STATS = "consensus_genome.compute_stats_out_output_stats".freeze
  OUTPUT_ZIP = "consensus_genome.zip_outputs_out_output_zip".freeze
  OUTPUT_CONSENSUS = "consensus_genome.make_consensus_out_consensus_fa".freeze

  WETLAB_PROTOCOL = {
    # See: https://www.illumina.com/products/by-brand/ampliseq.html
    ampliseq: "ampliseq",
    # See: https://artic.network/resources/ncov/ncov-amplicon-v3.pdf
    artic: "artic",
    # MSSPE + ARTIC concatenated
    combined_msspe_artic: "combined_msspe_artic",
    # See: https://www.nature.com/articles/s41564-019-0637-9
    msspe: "msspe",
    # See: https://swiftbiosci.com/swift-normalase-amplicon-panels
    snap: "snap",
  }.freeze

  # cacheable_only results will be stored in the db.
  # Full results will fetch from S3 (a superset of cached results).
  def results(cacheable_only: false)
    {
      coverage_viz: coverage_viz(cacheable_only: cacheable_only),
      quality_metrics: quality_metrics,
      taxon_info: taxon_info,
    }
  end

  def zip_link
    ConsensusGenomeZipService.call(self)
  rescue StandardError => exception
    LogUtil.log_error(
      "Error loading zip link",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  private

  def coverage_viz(cacheable_only: false)
    ConsensusGenomeCoverageService.call(workflow_run: self, cacheable_only: cacheable_only)
  rescue StandardError => exception
    LogUtil.log_error(
      "Error loading coverage viz",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  def quality_metrics
    ConsensusGenomeMetricsService.call(self)
  rescue StandardError => exception
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
      accession_id: "MN908947.3",
      accession_name: "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
      taxon_id: 2_697_049,
      taxon_name: "Severe acute respiratory syndrome coronavirus 2",
    }
  end
end
