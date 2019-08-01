class PipelineRunStage < ApplicationRecord
  include ApplicationHelper
  include PipelineRunsHelper
  include PipelineOutputsHelper
  belongs_to :pipeline_run

  JOB_TYPE_BATCH = 1
  COMMIT_SHA_FILE_ON_WORKER = "/mnt/idseq-pipeline/commit-sha.txt".freeze

  STATUS_STARTED = 'STARTED'.freeze
  STATUS_FAILED  = 'FAILED'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_ERROR = 'ERROR'.freeze
  STATUS_SUCCEEDED = 'SUCCEEDED'.freeze

  # Status file parameters for integration with pipeline
  JOB_SUCCEEDED_FILE_SUFFIX = "succeeded".freeze
  JOB_FAILED_FILE_SUFFIX = "failed".freeze

  # Stage names
  HOST_FILTERING_STAGE_NAME = 'Host Filtering'.freeze
  ALIGNMENT_STAGE_NAME = 'GSNAPL/RAPSEARCH alignment'.freeze
  POSTPROCESS_STAGE_NAME = 'Post Processing'.freeze
  EXPT_STAGE_NAME = "Experimental".freeze

  # Dag Json names
  DAG_NAME_HOST_FILTER = "host_filter".freeze
  DAG_NAME_ALIGNMENT = "non_host_alignment".freeze
  DAG_NAME_POSTPROCESS = "postprocess".freeze
  DAG_NAME_EXPERIMENTAL = "experimental".freeze

  STAGE_NAME_TO_DAG_NAME = {
    HOST_FILTERING_STAGE_NAME => DAG_NAME_HOST_FILTER,
    ALIGNMENT_STAGE_NAME => DAG_NAME_ALIGNMENT,
    POSTPROCESS_STAGE_NAME => DAG_NAME_POSTPROCESS,
    EXPT_STAGE_NAME => DAG_NAME_EXPERIMENTAL
  }.freeze

  # Max number of times we resubmit a job when it gets killed by EC2.
  MAX_RETRIES = 5

  def started?
    job_command.present?
  end

  def stage_status_file(status)
    basename = "#{job_id}.#{status}"
    "#{pipeline_run.sample.sample_output_s3_path}/#{basename}"
  end

  def dag_name
    STAGE_NAME_TO_DAG_NAME[name]
  end

  def step_status_file_path
    path_beginning = if step_number <= 2
                       pipeline_run.sample.sample_output_s3_path
                     else
                       pipeline_run.sample.sample_postprocess_s3_path
                     end
    "#{path_beginning}/#{pipeline_run.pipeline_version}/#{dag_name}_status.json"
  end

  def check_status_file_and_update(status_file_suffix, job_status_value)
    status_file_present = file_generated_since_run(pipeline_run, stage_status_file(status_file_suffix))
    if status_file_present && job_status != job_status_value
      update(job_status: job_status_value)
    end
  end

  def succeeded?
    job_status == STATUS_SUCCEEDED
  end

  def failed?
    job_status == STATUS_FAILED
  end

  def completed?
    failed? || succeeded?
  end

  def checked?
    job_status == STATUS_CHECKED
  end

  def redacted_dag_json
    # redact any s3 paths
    dag_json.gsub(%r{(\"s3://).*(\")}, '"s3://..."')
  end

  def run_job
    # Check output for the run and decide if we should run this stage
    return if started? && !failed? # job has been started successfully
    self.job_command = send(job_command_func)
    self.command_stdout, self.command_stderr, status = Open3.capture3(job_command)
    if status.exitstatus.zero?
      output = JSON.parse(command_stdout)
      self.job_id = output['jobId']
      self.job_status = STATUS_STARTED
    else
      self.job_status = STATUS_FAILED
    end
    self.created_at = Time.now.utc
    save
  end

  def duration_hrs
    (run_time / 60 / 60).round(2) if run_time
  end

  def run_time
    if completed?
      updated_at - created_at
    elsif started?
      Time.current - created_at
    end
  end

  def instance_terminated?(job_hash)
    job_hash['status'] == STATUS_FAILED &&
      job_hash['statusReason'].start_with?("Host EC2 (instance") &&
      job_hash['statusReason'].end_with?(") terminated.")
  end

  def add_failed_job
    existing_failed_jobs = failed_jobs ? "#{failed_jobs}, " : ""
    new_failed_job = "[#{job_id}, #{job_log_id}]"
    self.failed_jobs = existing_failed_jobs + new_failed_job
  end

  def count_failed_tries
    return 0 if failed_jobs.blank?
    1 + failed_jobs.count(",")
  end

  def due_for_aegea_check?
    rand < 0.1
  end

  def update_job_status
    if !id || !started?
      LogUtil.log_err_and_airbrake("Invalid precondition for PipelineRunStage.update_job_status #{id} #{job_id} #{job_status}.")
      return
    end
    check_status_file_and_update(JOB_SUCCEEDED_FILE_SUFFIX, STATUS_SUCCEEDED)
    check_status_file_and_update(JOB_FAILED_FILE_SUFFIX, STATUS_FAILED)
    if failed? || succeeded?
      unless job_log_id
        # set log id if not set
        _job_status, self.job_log_id, _job_hash, self.job_description = job_info(job_id, id)
        save
      end
      terminate_job
      return
    end
    # The job appears to be in progress.  Check to make sure it hasn't been killed in AWS.   But not too frequently.
    return unless due_for_aegea_check?
    self.job_status, self.job_log_id, job_hash, self.job_description = job_info(job_id, id)
    if [STATUS_ERROR, STATUS_FAILED].include?(job_status)
      save
      return
    end
    unless instance_terminated?(job_hash)
      save
      return
    end
    # note failed attempt and retry
    add_failed_job
    unless count_failed_tries <= MAX_RETRIES
      LogUtil.log_err_and_airbrake("Job #{job_id} for pipeline run #{id} was killed #{MAX_RETRIES} times.")
      save
      return
    end
    run_job # this saves
  end

  def terminate_job
    _stdout, _stderr, _status = Open3.capture3("aegea", "batch", "terminate", job_id.to_s)
  end

  def log_url
    return nil unless job_log_id
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=/aws/batch/job;stream=#{job_log_id}"
  end

  ########### STAGE SPECIFIC FUNCTIONS BELOW ############
  def prepare_dag(attribute_dict, key_s3_params = nil)
    sample = pipeline_run.sample
    dag_s3 = "#{sample.sample_output_s3_path}/#{dag_name}.json"
    attribute_dict[:bucket] = SAMPLES_BUCKET_NAME
    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.erb",
                           sample.project_id,
                           sample.id,
                           sample.host_genome_name.downcase,
                           attribute_dict,
                           pipeline_run.parse_dag_vars)
    self.dag_json = dag.render
    copy_done_file = "echo done | aws s3 cp - #{sample.sample_output_s3_path}/\\$AWS_BATCH_JOB_ID.#{JOB_SUCCEEDED_FILE_SUFFIX}"
    upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name, key_s3_params, copy_done_file)
  end

  def host_filtering_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    file_ext = sample.fasta_input? ? 'fasta' : 'fastq'
    attribute_dict = {
      fastq1: sample.input_files[0].name,
      file_ext: file_ext,
      star_genome: sample.s3_star_index_path,
      bowtie2_genome: sample.s3_bowtie2_index_path,
      max_fragments: pipeline_run.max_input_fragments,
      max_subsample_frag: pipeline_run.subsample
    }
    human_host_genome = HostGenome.find_by(name: "Human")
    attribute_dict[:human_star_genome] = human_host_genome.s3_star_index_path
    attribute_dict[:human_bowtie2_genome] = human_host_genome.s3_bowtie2_index_path
    attribute_dict[:fastq2] = sample.input_files[1].name if sample.input_files[1]
    attribute_dict[:adapter_fasta] = if sample.input_files[1]
                                       PipelineRun::ADAPTER_SEQUENCES["paired-end"]
                                     else
                                       PipelineRun::ADAPTER_SEQUENCES["single-end"]
                                     end
    dag_commands = prepare_dag(attribute_dict)

    batch_command = [install_pipeline(pipeline_run.pipeline_commit), upload_version(pipeline_run.pipeline_version_file), dag_commands].join("; ")

    # Dispatch job. Use the himem settings for host filtering.
    aegea_batch_submit_command(batch_command, vcpus: Sample::DEFAULT_VCPUS_HIMEM, job_queue: Sample::DEFAULT_QUEUE_HIMEM, memory: Sample::HIMEM_IN_MB)
  end

  def alignment_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      input_file_count: sample.input_files.count,
      skip_dedeuterostome_filter: sample.skip_deutero_filter_flag,
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_version,
      index_dir_suffix: alignment_config.index_dir_suffix,
      lineage_db: alignment_config.s3_lineage_path,
      accession2taxid_db: alignment_config.s3_accession2taxid_path,
      deuterostome_db: alignment_config.s3_deuterostome_db_path,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path,
      nr_db: alignment_config.s3_nr_db_path,
      nr_loc_db: alignment_config.s3_nr_loc_db_path,
      max_interval_between_describe_instances: PipelineRun::MAX_JOB_DISPATCH_LAG_SECONDS,
      job_tag_prefix: PipelineRun::JOB_TAG_PREFIX,
      job_tag_refresh_seconds: PipelineRun::JOB_TAG_KEEP_ALIVE_SECONDS,
      draining_tag: PipelineRun::DRAINING_TAG,
      gsnap_chunk_size: PipelineRun::GSNAP_CHUNK_SIZE,
      rapsearch_chunk_size: PipelineRun::RAPSEARCH_CHUNK_SIZE,
      gsnap_max_concurrent: PipelineRun::GSNAP_MAX_CONCURRENT,
      rapsearch_max_concurrent: PipelineRun::RAPSEARCH_MAX_CONCURRENT,
      chunks_in_flight: PipelineRun::MAX_CHUNKS_IN_FLIGHT,
      gsnap_m8: PipelineRun::GSNAP_M8,
      rapsearch_m8: PipelineRun::RAPSEARCH_M8
    }
    key_s3_params = format("--key-path-s3 s3://idseq-secrets/idseq-%s.pem", (Rails.env == 'prod' ? 'prod' : 'staging')) # TODO: This is hacky
    dag_commands = prepare_dag(attribute_dict, key_s3_params)
    batch_command = [install_pipeline(pipeline_run.pipeline_commit), dag_commands].join("; ")
    # Run it
    aegea_batch_submit_command(batch_command)
  end

  def postprocess_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      input_file_count: sample.input_files.count,
      skip_dedeuterostome_filter: sample.skip_deutero_filter_flag,
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_version,
      index_dir_suffix: alignment_config.index_dir_suffix,
      lineage_db: alignment_config.s3_lineage_path,
      accession2taxid_db: alignment_config.s3_accession2taxid_path,
      deuterostome_db: alignment_config.s3_deuterostome_db_path,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path,
      nr_db: alignment_config.s3_nr_db_path,
      nr_loc_db: alignment_config.s3_nr_loc_db_path
    }
    dag_commands = prepare_dag(attribute_dict)
    batch_command = [install_pipeline(pipeline_run.pipeline_commit), dag_commands].join("; ")
    # Dispatch job with himem number of vCPUs and to the himem queue.
    aegea_batch_submit_command(batch_command, vcpus: Sample::DEFAULT_VCPUS_HIMEM, job_queue: Sample::DEFAULT_QUEUE_HIMEM, memory: Sample::HIMEM_IN_MB)
  end

  def experimental_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    file_ext = sample.fasta_input? ? 'fasta' : 'fastq'
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      fastq1: sample.input_files[0].name,
      file_ext: file_ext,
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_version,
      lineage_db: alignment_config.s3_lineage_path,
      accession2taxid_db: alignment_config.s3_accession2taxid_path,
      deuterostome_db: alignment_config.s3_deuterostome_db_path,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path,
      nr_db: alignment_config.s3_nr_db_path,
      nr_loc_db: alignment_config.s3_nr_loc_db_path
    }
    attribute_dict[:fastq2] = sample.input_files[1].name if sample.input_files[1]
    dag_commands = prepare_dag(attribute_dict)
    batch_command = [install_pipeline(pipeline_run.pipeline_commit), dag_commands].join("; ")

    # Dispatch job
    aegea_batch_submit_command(batch_command)
  end
end
