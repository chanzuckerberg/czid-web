task populate_fraction_subsampled: :environment do
  pipeline_runs = PipelineRun.where("id in (select max(id) from pipeline_runs where job_status = 'CHECKED' and sample_id in (select id from samples) group by sample_id)")
  pipeline_runs = pipeline_runs.order(id: :desc)
  pipeline_runs.each do |pr|
    pr.fraction_subsampled = pr.subsample_fraction
  end
end
