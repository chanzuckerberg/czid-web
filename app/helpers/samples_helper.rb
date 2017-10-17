module SamplesHelper
  def host_genomes_list
    HostGenome.all.map { |h| [h.name, h.id] }
  end

  def get_summary_stats(jobstats)
    { remaining_reads: get_remaining_reads(jobstats),
      compression_ratio: compute_compression_ratio(jobstats),
      qc_percent: compute_qc_value(jobstats),
      percent_remaining: compute_percentage_reads(jobstats) }
  end

  def get_remaining_reads(jobstats)
    # reads remaining after host filtering
    jobstats.find_by(task: 'run_bowtie2').reads_after
  end

  def compute_compression_ratio(jobstats)
    cdhitdup_stats = jobstats.find_by(task: 'run_cdhitdup')
    (1.0 * cdhitdup_stats.reads_before) / cdhitdup_stats.reads_after
  end

  def compute_qc_value(jobstats)
    priceseqfilter_stats = jobstats.find_by(task: 'run_priceseqfilter')
    (100.0 * priceseqfilter_stats.reads_after) / priceseqfilter_stats.reads_before
  end

  def compute_percentage_reads(jobstats)
    (100.0 * jobstats.find_by(task: 'run_bowtie2').reads_after) / jobstats.find_by(task: 'run_star').reads_before
  end
end
