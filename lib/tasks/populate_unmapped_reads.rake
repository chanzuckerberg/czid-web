task populate_unmapped_reads: :environment do
  pipeline_runs = PipelineRun.where("id in (select max(id) from pipeline_runs where job_status = 'CHECKED' and sample_id in (select id from samples) group by sample_id)")
  pipeline_runs.each do |pr|
    pr.update(unmapped_reads: pr.count_unmapped_reads)
  end
end
