def record_previous_state(pr)
  json_output = pr.to_json(include: [:pipeline_run_stages, :output_states])
  file = Tempfile.new
  file.write(json_output)
  file.close
  # Copy file to S3
  pr_s3_file_name = "pipeline_run_#{pr.id}.json"
  _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", file.path.to_s,
                                            "#{pr.archive_s3_path}/pre_migrate_run_status/#{pr_s3_file_name}")
  file.unlink
end


def migrate_pre_run_stages(pr)
  target_outputs = %w[ercc_counts taxon_counts taxon_byteranges]
  if %w[CHECKED SUCCEEDED].include?(pr.job_status)
    pr.update(results_finalized: PipelineRun::FINALIZED_SUCCESS)
    target_outputs.each do |output|
      OutputState.create(pipeline_run_id: pr.id, output: output, state: PipelineRun::STATUS_LOADED)
    end
  elsif %w[FAILED ERROR].include?(pr.job_status)
    pr.create_output_states
    pr.update(results_finalized: PipelineRun::FINALIZED_FAIL)
  else
    pr.create_output_states
    pr.update(results_finalized: PipelineRun::IN_PROGRESS) # shouldn't be the case for any of those old runs
  end
  pr.create_run_stages
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
