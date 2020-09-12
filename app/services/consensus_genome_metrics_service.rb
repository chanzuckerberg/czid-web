class ConsensusGenomeMetricsService
  include Callable

  OUTPUT_QUAST = "consensus_genome.quast_out_quast_tsv".freeze
  OUTPUT_STATS = "consensus_genome.compute_stats_out_output_stats".freeze

  def initialize(workflow_run)
    @workflow_run = workflow_run
  end

  def call
    return generate
  end

  private

  def generate
    cache_key = "cg_metrics-#{@workflow_run.id}-#{@workflow_run.status}"
    Rails.cache.fetch(cache_key, expires_in: 30.days) do
      quast_data = @workflow_run.output(OUTPUT_QUAST)
      stats_data = @workflow_run.output(OUTPUT_STATS)
      format_metrics(quast_data, stats_data)
    end
  end

  def format_metrics(quast_data, stats_data)
    quast_data = CSVSafe.parse(quast_data, col_sep: "\t").to_h
    metrics = JSON.parse(stats_data).symbolize_keys

    allowed_keys = [:total_reads, :ref_snps, :n_actg, :n_missing, :n_ambiguous]
    metrics = metrics.slice(*allowed_keys)

    metrics[:percent_identity] = ((metrics[:n_actg] - metrics[:ref_snps]) / metrics[:n_actg].to_f * 100).round(1)
    metrics[:gc_percent] = quast_data["GC (%)"].to_f
    return metrics
  end
end
