task populate_ercc_counts: :environment do
  pipeline_runs = PipelineRun.top_completed_runs
  pipeline_runs = pipeline_runs.order(id: :desc)
  pipeline_runs.each do |pr|
    next if pr.total_ercc_reads
    pr.load_ercc_counts
    pr.save
  end
end
