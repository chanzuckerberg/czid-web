# Backfill the AccessionCoverageStats from s3 for pipeline runs v6.0+.
# AccessionCoverageStats weren't added as an output to be loaded into
# the db until v6.8.3, when coverage_breadth values needed to become
# more readily accessible.
# Example: rake "populate_accession_coverage_stats[1, 100]"
# to backfill for 100 pipeline runs, starting from run id 1.
task :populate_accession_coverage_stats, [:first_pr, :batch_size] => :environment do |_t, args|
  first_pr_id = args[:first_pr].to_i
  batch_size = args[:batch_size].to_i
  last_pr_id = first_pr_id + batch_size

  pipeline_runs = PipelineRun.where(id: first_pr_id...last_pr_id).where('pipeline_version LIKE ?', '6.%')
  pipeline_runs.each do |pr|
    next unless pr.accession_coverage_stats.empty?

    pr.db_load_accession_coverage_stats
    pr.save
  end

  Rails.logger.info("AccessionCoverageStats populated for PipelineRuns v6.0+, from ids #{first_pr_id} to #{last_pr_id - 1}")
end
