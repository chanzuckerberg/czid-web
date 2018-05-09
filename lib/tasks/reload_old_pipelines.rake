task reload_old_pipelines: :environment do
  Sample.all.each(&:reload_old_pipeline_runs)
end
