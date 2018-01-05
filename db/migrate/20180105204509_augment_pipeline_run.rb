class AugmentPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :total_reads, :bigint
    add_column :pipeline_runs, :remaining_reads, :bigint
    add_column :pipeline_runs, :unmapped_reads, :bigint
    add_column :job_stats, :pipeline_run_id, :bigint
    add_column :taxon_byteranges, :pipeline_run_id, :bigint
    add_column :taxon_counts, :pipeline_run_id, :bigint
  end
end
