class ConsensusGenomeWorkflowRun < WorkflowRun
  # Model Notes:
  #
  # Where is the schema for this model?
  # * This inherits from WorkflowRun, following a Single Table Inheritance
  #   pattern. The hope is one generic WorkflowRun schema can cover many
  #   different workflow use-cases.
  #
  # Why do we have one main 'results' method?
  # * The idea is that the model should have one set of well-defined outputs
  #   that are consistently served, instead of having client pages compose
  #   different sets of results each time.
  OUTPUT_CONSENSUS = "consensus_genome.make_consensus_out_consensus_fa".freeze
  OUTPUT_DEPTHS = "consensus_genome.compute_stats_out_sam_depths".freeze
  OUTPUT_QUAST = "consensus_genome.quast_out_quast_tsv".freeze
  OUTPUT_STATS = "consensus_genome.compute_stats_out_output_stats".freeze
  OUTPUT_VADR_QUALITY = "consensus_genome.vadr_quality_out".freeze
  OUTPUT_ZIP = "consensus_genome.zip_outputs_out_output_zip".freeze

  SARS_COV_2_ACCESSION_ID = "MN908947.3".freeze

  WETLAB_PROTOCOL = {
    # See: https://www.illumina.com/products/by-brand/ampliseq.html
    ampliseq: "ampliseq",
    # See: https://artic.network/resources/ncov/ncov-amplicon-v3.pdf
    artic: "artic",
    # See: https://raw.githubusercontent.com/artic-network/artic-ncov2019/master/primer_schemes/nCoV-2019/V4/SARS-CoV-2.primer.bed
    artic_v4: "artic_v4",
    # Artic v3 with short amplicons (275 bp) from Biohub
    artic_short_amplicons: "artic_short_amplicons",
    # MSSPE + ARTIC concatenated
    combined_msspe_artic: "combined_msspe_artic",
    # Retrieved from: https://github.com/artic-network/artic-ncov2019/blob/master/primer_schemes/nCoV-2019/V1/nCoV-2019.bed
    covidseq: "covidseq",
    # Midnight primer set used at Biohub for Nanopore samples to produce longer reads and reduce the likelihood of
    # coverage drop-out due to genome mutations in the primer sites.
    midnight: "midnight",
    # See: https://www.nature.com/articles/s41564-019-0637-9
    msspe: "msspe",
    # See: https://swiftbiosci.com/swift-normalase-amplicon-panels
    snap: "snap",
  }.freeze

  DEFAULT_MEDAKA_MODEL = "r941_min_high_g360".freeze
  MEDAKA_MODEL_OPTIONS = [
    "r941_min_high_g360",
    "r941_min_fast_g303",
    "r941_min_high_g303",
    "r941_min_high_g330",
    "r941_min_high_g340_rle",
    "r941_min_high_g344",
    "r941_min_high_g351",
    "r103_prom_high_g360",
    "r103_prom_snp_g3210",
    "r103_prom_variant_g3210",
    "r941_prom_fast_g303",
    "r941_prom_high_g303",
    "r941_prom_high_g330",
    "r941_prom_high_g344",
    "r941_prom_high_g360",
    "r941_prom_high_g4011",
    "r941_prom_snp_g303",
    "r941_prom_snp_g322",
    "r941_prom_snp_g360",
    "r941_prom_variant_g303",
    "r941_prom_variant_g322",
    "r941_prom_variant_g360",
  ].freeze
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
