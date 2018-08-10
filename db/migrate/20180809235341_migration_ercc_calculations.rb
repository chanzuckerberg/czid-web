class MigrationErccCalculations < ActiveRecord::Migration[5.1]
  def change
    sample_to_file_count = ActiveRecord::Base.connection.execute(
      "SELECT sample_id, COUNT(1) FROM input_files GROUP BY sample_id"
    ).to_h
    pipeline_run_to_ercc_frags = ActiveRecord::Base.connection.execute(
      "SELECT pipeline_run_id, sum(count) FROM ercc_counts GROUP BY pipeline_run_id"
    ).to_h

    prs = PipelineRun.where("total_ercc_reads IS NOT NULL")
    prs.each do |pr|
      total_ercc_reads = pipeline_run_to_ercc_frags[pr.id].to_i * sample_to_file_count[pr.sample_id]
      pr.update(total_ercc_reads: total_ercc_reads)
    end
  end
end
