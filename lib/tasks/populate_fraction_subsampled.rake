task populate_fraction_subsampled: :environment do
  pipeline_runs = PipelineRun.top_completed_runs
  pipeline_runs = pipeline_runs.order(id: :desc)
  pipeline_runs.each do |pr|
    pr.update(fraction_subsampled: pr.subsample_fraction)
  end
end
