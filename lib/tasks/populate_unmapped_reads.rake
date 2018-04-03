task populate_unmapped_reads: :environment do
  pipeline_runs = PipelineRun.top_completed_runs
  pipeline_runs.each do |pr|
    pr.update(unmapped_reads: pr.count_unmapped_reads)
  end
end
