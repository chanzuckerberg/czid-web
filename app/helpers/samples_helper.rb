module SamplesHelper
  def host_genomes_list
    HostGenome.all.map { |h| [h.name, h.id] }
  end

  def getSummaryStats(jobstats)
    { remaining_reads: getRemainingReads(jobstats),
      compression_ratio: computeCompressionRatio(jobstats),
      qc_percent: computeQcValue(jobstats),
      percent_remaining: computePercentageReads(jobstats) }
  end

  def getRemainingReads(jobstats)
    # reads remaining after host filtering
    jobstats.find_by(task: 'run_bowtie2').reads_after
  end

  def computeCompressionRatio(jobstats)
    cdhitdup_stats = jobstats.find_by(task: 'run_cdhitdup')
    (1.0 * cdhitdup_stats.reads_before)/cdhitdup_stats.reads_after
  end
  
  def computeQcValue(jobstats)
    priceseqfilter_stats = jobstats.find_by(task: 'run_priceseqfilter')
    (100.0 * priceseqfilter_stats.reads_after)/priceseqfilter_stats.reads_before
  end

  def computePercentageReads(jobstats)
    (100.0 * jobstats.find_by(task: 'run_bowtie2').reads_after)/jobstats.find_by(task: 'run_star').reads_before
  end
end
