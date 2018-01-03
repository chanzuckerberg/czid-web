task archive_all_old_pipeline_runs: :environment do
  Sample.all.each(&:archive_old_pipeline_runs)
end
