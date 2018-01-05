task populate_run_ids: :environment do
  # Populate pipeline_run_ids to replace pipeline_outputs
  ActiveRecord::Base.connection.execute("
    UPDATE pipeline_runs INNER JOIN pipeline_outputs ON
      pipeline_outputs.pipeline_run_id = pipeline_runs.id
      set pipeline_runs.total_reads = pipeline_outputs.total_reads,
          pipeline_runs.remaining_reads = pipeline_outputs.remaining_reads,
          pipeline_runs.unmapped_reads = pipeline_outputs.unmapped_reads
  ")
  ActiveRecord::Base.connection.execute("
    UPDATE job_stats INNER JOIN pipeline_outputs ON
      job_stats.pipeline_output_id = pipeline_outputs.id
      set job_stats.pipeline_run_id = pipeline_outputs.pipeline_run_id
  ")
  ActiveRecord::Base.connection.execute("
    UPDATE taxon_byteranges INNER JOIN pipeline_outputs ON
      taxon_byteranges.pipeline_output_id = pipeline_outputs.id
      set taxon_byteranges.pipeline_run_id = pipeline_outputs.pipeline_run_id
  ")
  ActiveRecord::Base.connection.execute("
    UPDATE taxon_counts INNER JOIN pipeline_outputs ON
      taxon_counts.pipeline_output_id = pipeline_outputs.id
      set taxon_counts.pipeline_run_id = pipeline_outputs.pipeline_run_id
  ")
end
