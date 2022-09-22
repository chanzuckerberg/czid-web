class ConsensusGenomeMetricsService
  include Callable

  QUALITY_METRICS = {
    reference_genome_length: "Reference Length",
    percent_genome_called: "% Genome Called",
    percent_identity: "%id",
    gc_percent: "GC Content",
    ercc_mapped_reads: "ERCC Reads",
    total_reads: "Total Reads",
    mapped_reads: "Mapped Reads",
    ref_snps: "SNPs",
    n_actg: "Informative Nucleotides",
    n_missing: "Missing Bases",
    n_ambiguous: "Ambiguous Bases",
  }.freeze

  COVERAGE_METRICS = {
    coverage_depth: "Coverage Depth",
  }.freeze

  ALL_METRICS = QUALITY_METRICS.merge(COVERAGE_METRICS).freeze

  OUTPUT_STATS_METRICS = [
    :ercc_mapped_reads,
    :mapped_reads,
    :n_actg,
    :n_ambiguous,
    :n_missing,
    :ref_snps,
    :total_reads,
  ].freeze

  def initialize(workflow_run)
    @workflow_run = workflow_run
  end

  def call
    return generate
  end

  private

  def generate
    metrics = {}
    metrics = add_primary_metrics(metrics)
    metrics = add_quast_metrics(metrics)

    if @workflow_run.inputs&.[]("accession_id") == ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID
      begin
        metrics = add_vadr_metrics(metrics)
      rescue SfnExecution::OutputNotFoundError
        # Pass because CG runs pre-v2.0.0 will not have VADR outputs available.
      end
    end
    return metrics
  rescue SfnExecution::SfnDescriptionNotFoundError => err
    LogUtil.log_error("ConsensusGenomeMetricsService: Cannot generate Consensus Genome metrics when the SFN description is not found", exception: err)
    return nil
  end

  def add_primary_metrics(metrics)
    stats_data = @workflow_run.output(ConsensusGenomeWorkflowRun::OUTPUT_STATS)
    stats_data = JSON.parse(stats_data).symbolize_keys
    metrics = metrics.merge(stats_data.slice(*OUTPUT_STATS_METRICS))
    metrics[:percent_identity] = ((metrics[:n_actg] - metrics[:ref_snps]) / metrics[:n_actg].to_f * 100).round(1)
    return metrics
  end

  # NOTE: This uses :n_actg, so add_primary_metrics should come first.
  def add_quast_metrics(metrics)
    quast_data = @workflow_run.output(ConsensusGenomeWorkflowRun::OUTPUT_QUAST)
    quast_data = CSVSafe.parse(quast_data, col_sep: "\t").to_h
    metrics[:gc_percent] = quast_data["GC (%)"].to_f.round(1)
    # Different from 'depth_frac_above_10x'. 'depth_frac_above_10x' means the base is covered by at least 10 sequences. 'n_actg' is used here b/c 'n_actg' is only called when >90% of the underlying sequences match that allele.
    metrics[:percent_genome_called] = (metrics[:n_actg] / quast_data["Reference length"].to_f * 100).round(1)
    metrics[:reference_genome_length] = quast_data["Reference length"].to_i
    return metrics
  end

  def add_vadr_metrics(metrics)
    # See: https://github.com/ncbi/vadr/blob/master/documentation/formats.md#sqc
    # The file vadr-output.vadr.sqc has an odd custom format:
    #
    # p/f
    # ----
    # FAIL
    vadr_data = @workflow_run.output(ConsensusGenomeWorkflowRun::OUTPUT_VADR_QUALITY)
    # First two lines are for the header, so skip the first line.
    # Then squeeze spaces to identify columns b/c it is unfortunately not tab-delimited.
    vadr_data = vadr_data.lines[1..-1].map { |i| i.squeeze(" ") }.join
    vadr_data = CSVSafe.parse(vadr_data, col_sep: " ", headers: true)
    # Use vadr_data[1] because vadr_data[0] is the row with ----.
    metrics[:vadr_pass_fail] = vadr_data[1]["p/f"]
    return metrics
  end
end
