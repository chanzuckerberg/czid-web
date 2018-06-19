task fix_count_reads: :environment do
  pipeline_runs = PipelineRun.top_completed_runs.where("created_at > ?", 30.days.ago)
  pipeline_runs.each do |pr|
    stats = pr.job_stats
    if stats.find_by("task": "run_cdhitdup") && stats.find_by("task": "run_cdhitdup").reads_before > stats.find_by("task": "run_priceseqfilter").reads_after && (stats.find_by("task": "run_cdhitdup").reads_before == 1.5 * stats.find_by("task": "run_priceseqfilter").reads_after)
    # puts "BEFORE: " + stats.inspect
    # puts pr.job_stats.find_by("task": "run_cdhitdup").reads_before
    # puts pr.job_stats.find_by("task": "run_priceseqfilter").reads_after
    field = stats.find_by("task": "run_cdhitdup")
    field.reads_before /= 1.5
    field.reads_after /= 1.5
    field.save
    field = stats.find_by("task": "run_lzw")
    field.reads_before /= 1.5
    field.reads_after /= 1.5
    field.save
    field = stats.find_by("task": "run_bowtie2")
    field.reads_before /= 1.5
    field.reads_after /= 1.5
    field.save

    pr.remaining_reads /= 1.5
    pr.save
    pr.fraction_subsampled = pr.subsample_fraction
    pr.save
    # puts pr.id
    # puts "AFTER: " + pr.job_stats.inspect
    # puts pr.job_stats.find_by("task": "run_cdhitdup").reads_before
    # puts pr.job_stats.find_by("task": "run_priceseqfilter").reads_after
#    break
    end
  end
end
