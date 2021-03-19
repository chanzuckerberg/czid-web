class ConsensusGenomeMetricsService
  include Callable

  def initialize(workflow_run)
    @workflow_run = workflow_run
  end

  def call
    return generate
  end

  private

  def generate
    quast_data = @workflow_run.output(ConsensusGenomeWorkflowRun::OUTPUT_QUAST)
    stats_data = @workflow_run.output(ConsensusGenomeWorkflowRun::OUTPUT_STATS)
    format_metrics(quast_data, stats_data)
  rescue SfnExecution::SfnDescriptionNotFoundError => err
    LogUtil.log_error("ConsensusGenomeMetricsService: Cannot generate Consensus Genome metrics when the SFN description is not found", exception: err)
    return nil
  end

  def format_metrics(quast_data, stats_data)
    quast_data = CSVSafe.parse(quast_data, col_sep: "\t").to_h
    metrics = JSON.parse(stats_data).symbolize_keys

    allowed_keys = [:ercc_mapped_reads, :total_reads, :mapped_reads, :ref_snps, :n_actg, :n_missing, :n_ambiguous]
    metrics = metrics.slice(*allowed_keys)

    metrics[:gc_percent] = quast_data["GC (%)"].to_f.round(1)
    metrics[:percent_identity] = ((metrics[:n_actg] - metrics[:ref_snps]) / metrics[:n_actg].to_f * 100).round(1)

    # Different from 'depth_frac_above_10x'. 'depth_frac_above_10x' means the base is covered by at least 10 sequences. 'n_actg' is used here b/c 'n_actg' is only called when >90% of the underlying sequences match that allele.
    metrics[:percent_genome_called] = (metrics[:n_actg] / quast_data["Reference length"].to_f * 100).round(1)

    metrics[:reference_genome_length] = quast_data["Reference length"].to_i
    return metrics
  end
end
