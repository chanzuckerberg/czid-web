def record_previous_state(pr)
  json_output = pr.to_json(include: [:pipeline_run_stages, :output_states])
  file = Tempfile.new
  file.write(json_output)
  file.close
  # Copy file to S3
  pr_s3_file_name = "pipeline_run_#{pr.id}.json"
  Open3.capture3("aws", "s3", "cp", file.path.to_s,
                 "#{pr.archive_s3_path}/pre_migrate_run_status/#{pr_s3_file_name}")
  file.unlink
end

def migrate_pre_run_stages(pr)
  pr.create_run_stages
  pr.create_output_states
  if %w[CHECKED SUCCEEDED].include?(pr.job_status)
    pr.update(finalized: 1)
    pr.update(results_finalized: PipelineRun::FINALIZED_SUCCESS)
    pr.output_states.each { |s| s.update(state: PipelineRun::STATUS_LOADED) }
  elsif %w[FAILED ERROR].include?(pr.job_status)
    pr.update(finalized: 1)
    pr.update(results_finalized: PipelineRun::FINALIZED_FAIL)
  else
    pr.update(results_finalized: PipelineRun::IN_PROGRESS) # shouldn't be the case for any of those old runs
  end
end

def migrate_pre_result_monitor(pr)
  old_loaders_by_output = { "db_load_host_filtering" => "ercc_counts",
                            "db_load_alignment" => "taxon_counts",
                            "db_load_postprocess" => "taxon_byteranges" }
  run_stages = pr.pipeline_run_stages
  run_stages.each do |rs|
    OutputState.create(pipeline_run_id: pr.id,
                       output: old_loaders_by_output[rs.load_db_command_func],
                       state: rs.job_status)
  end
  if pr.all_output_states_loaded?
    pr.update(results_finalized: PipelineRun::FINALIZED_SUCCESS)
  elsif pr.output_states.pluck(:state).any? { |s| s == PipelineRun::STATUS_FAILED }
    pr.update(results_finalized: PipelineRun::FINALIZED_FAIL)
  else
    pr.update(results_finalized: PipelineRun::IN_PROGRESS) # shouldn't be the case
  end
end

task migrate_run_status: :environment do
  pipeline_runs = PipelineRun.all
  pipeline_runs.each do |pr|
    if pr.pipeline_run_stages.blank?
      record_previous_state(pr)
      migrate_pre_run_stages(pr)
    elsif pr.pre_result_monitor?
      migrate_pre_result_monitor(pr)
    end
  end
end
