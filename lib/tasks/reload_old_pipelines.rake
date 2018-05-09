task reload_old_pipelines: :environment do
  Sample.all.each { |s| s.reload_old_pipeline_runs }
end
