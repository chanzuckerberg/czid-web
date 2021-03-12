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
    # Artic v3 with short amplicons (275 bp) from Biohub
    artic_short_amplicons: "artic_short_amplicons",
    # MSSPE + ARTIC concatenated
    combined_msspe_artic: "combined_msspe_artic",
    # See: https://www.nature.com/articles/s41564-019-0637-9
    msspe: "msspe",
    # See: https://swiftbiosci.com/swift-normalase-amplicon-panels
    snap: "snap",
  }.freeze

  DEFAULT_MEDAKA_MODEL = "r941_grid_fast_g303".freeze
  # Never interpolate user input into DEFAULT_VADR_OPTIONS to prevent command injection.
  DEFAULT_VADR_OPTIONS = "-s -r --nomisc --mkey NC_045512 --lowsim5term 2 --lowsim3term 2 --fstlowthr 0.0 --alt_fail lowscore,fsthicnf,fstlocnf".freeze

  TECHNOLOGY_INPUT = {
    illumina: "Illumina",
    nanopore: "ONT",
  }.freeze

  TECHNOLOGY_NAME = TECHNOLOGY_INPUT.invert

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
    return {
      accession_id: inputs&.[]("accession_id"),
      accession_name: inputs&.[]("accession_name"),
      taxon_id: inputs&.[]("taxon_id"),
      taxon_name: inputs&.[]("taxon_name"),
    }
  end
end
