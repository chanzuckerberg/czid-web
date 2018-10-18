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

  # Max number of times we resubmit a job when it gets killed by EC2.
  MAX_RETRIES = 5

  def started?
    job_command.present?
  end

  def stage_status_file(status)
    basename = "#{job_id}.#{status}"
    "#{pipeline_run.sample.sample_output_s3_path}/#{basename}"
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
  def prepare_dag(dag_name, attribute_dict, key_s3_params = nil)
    sample = pipeline_run.sample
    dag_s3 = "#{sample.sample_output_s3_path}/#{dag_name}.json"
    attribute_dict[:bucket] = SAMPLES_BUCKET_NAME
    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.erb",
                           sample.project_id,
                           sample.id,
                           sample.host_genome_name.downcase,
                           attribute_dict)
    self.dag_json = dag.render
    copy_done_file = "echo done | aws s3 cp - #{sample.sample_output_s3_path}/\\$AWS_BATCH_JOB_ID.#{JOB_SUCCEEDED_FILE_SUFFIX}"
    upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name, key_s3_params, copy_done_file)
  end

  def host_filtering_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    file_type = sample.fasta_input? ? 'fasta' : 'fastq'
    attribute_dict = {
      fastq1: sample.input_files[0].name,
      file_type: file_type,
      star_genome: sample.s3_star_index_path,
      bowtie2_genome: sample.s3_bowtie2_index_path,
      max_fragments: PipelineRun::MAX_INPUT_FRAGMENTS,
      max_subsample_frag: pipeline_run.subsample
    }
    attribute_dict[:fastq2] = sample.input_files[1].name if sample.input_files[1]
    dag_commands = prepare_dag("host_filter", attribute_dict)

    batch_command = [install_pipeline(pipeline_run.pipeline_commit), upload_version(pipeline_run.pipeline_version_file), dag_commands].join("; ")

    # Dispatch job
    memory = sample.sample_memory.present? ? sample.sample_memory : Sample::DEFAULT_MEMORY_IN_MB
    aegea_batch_submit_command(batch_command, memory: memory, job_queue: pipeline_run.sample.job_queue)
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
      nr_loc_db: alignment_config.s3_nr_loc_db_path
    }
    key_s3_params = format("--key-path-s3 s3://idseq-secrets/idseq-%s.pem", (Rails.env == 'prod' ? 'prod' : 'staging')) # TODO: This is hacky
    dag_commands = prepare_dag("non_host_alignment", attribute_dict, key_s3_params)
    batch_command = [install_pipeline(pipeline_run.pipeline_commit), dag_commands].join("; ")
    # Run it
    aegea_batch_submit_command(batch_command, job_queue: pipeline_run.sample.job_queue)
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
    dag_commands = prepare_dag("postprocess", attribute_dict)
    batch_command = [install_pipeline(pipeline_run.pipeline_commit), dag_commands].join("; ")
    # Dispatch job with himem number of vCPUs and to the himem queue.
    aegea_batch_submit_command(batch_command, vcpus: Sample::DEFAULT_VCPUS_HIMEM, job_queue: Sample::DEFAULT_QUEUE_HIMEM, memory: Sample::HOST_FILTERING_MEMORY_IN_MB)
  end

  def experimental_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    file_type = sample.fasta_input? ? 'fasta' : 'fastq'
    attribute_dict = {
      fastq1: sample.input_files[0].name,
      file_type: file_type
    }
    attribute_dict[:fastq2] = sample.input_files[1].name if sample.input_files[1]
    dag_commands = prepare_dag("experimental", attribute_dict)
    batch_command = [install_pipeline(pipeline_run.pipeline_commit), dag_commands].join("; ")

    # Dispatch job
    aegea_batch_submit_command(batch_command, job_queue: pipeline_run.sample.job_queue)
  end
end
