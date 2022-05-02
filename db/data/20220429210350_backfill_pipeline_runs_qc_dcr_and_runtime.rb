# frozen_string_literal: true

class BackfillPipelineRunsQcDcrAndRuntime < ActiveRecord::Migration[6.1]
  disable_ddl_transaction!

  def up
    PipelineRun.find_each do |pr|
      if pr.qc_percent.blank? || pr.compression_ratio.blank?
        job_stats_hash = pr.job_stats.index_by(&:task)

        if pr.qc_percent.blank?
          pr.load_qc_percent(job_stats_hash)
        end
        if pr.compression_ratio.blank?
          pr.load_compression_ratio(job_stats_hash)
        end
      end

      if pr.time_to_finalized.blank? && pr.finalized?
        time_to_finalized = 0
        pr.pipeline_run_stages.each do |stage|
          time_to_finalized += stage.run_time if stage.run_time.present?
        end
        pr.update(time_to_finalized: time_to_finalized)
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
