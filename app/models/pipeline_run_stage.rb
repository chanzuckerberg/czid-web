class PipelineRunStage < ApplicationRecord
  include ApplicationHelper
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

  # Max number of times we resubmit a job when it gets killed by EC2.
  MAX_RETRIES = 5

  def install_pipeline
    "pip install --upgrade git+git://github.com/chanzuckerberg/s3mi.git; " \
    "cd /mnt; " \
    "git clone https://github.com/chanzuckerberg/idseq-dag.git; " \
    "cd idseq-dag; " \
    "git checkout #{pipeline_run.pipeline_commit}; " \
    "pip3 install -e . --upgrade"
  end

  def aegea_batch_submit_command(base_command, memory = Sample::DEFAULT_MEMORY_IN_MB)
    command = "aegea batch submit --command=\"#{base_command}\" "
    if memory <= Sample::DEFAULT_MEMORY_IN_MB
      vcpus = Sample::DEFAULT_VCPUS
      queue = Sample::DEFAULT_QUEUE
    else
      vcpus = Sample::DEFAULT_VCPUS_HIMEM
      queue = Sample::DEFAULT_QUEUE_HIMEM
    end
    if pipeline_run.sample.job_queue.present?
      if Sample::DEPRECATED_QUEUES.include? pipeline_run.sample.job_queue
        Rails.logger.info "Overriding deprecated queue #{pipeline_run.sample.job_queue} with #{queue}"
      else
        queue = pipeline_run.sample.job_queue
      end
    end
    command += " --storage /mnt=#{Sample::DEFAULT_STORAGE_IN_GB} --volume-type gp2 --ecr-image idseq_dag --memory #{memory} --queue #{queue} --vcpus #{vcpus} --job-role idseq-pipeline "
    command
  end

  def started?
    job_command.present?
  end

  def stage_status_file(status)
    basename = "#{job_id}.#{status}"
    "#{pipeline_run.sample.sample_output_s3_path}/#{basename}"
  end

  def check_status_file_and_update(status_file_suffix, job_status_value)
    status_file_present = pipeline_run.file_generated_since_run(stage_status_file(status_file_suffix))
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
      Airbrake.notify("Invalid precondition for PipelineRunStage.update_job_status #{id} #{job_id} #{job_status}.")
      return
    end
    check_status_file_and_update(JOB_SUCCEEDED_FILE_SUFFIX, STATUS_SUCCEEDED)
    check_status_file_and_update(JOB_FAILED_FILE_SUFFIX, STATUS_FAILED)
    if failed? || succeeded?
      unless job_log_id
        # set log id if not set
        _job_status, self.job_log_id, _job_hash, self.job_description = PipelineRunStage.job_info(job_id, id)
        save
      end
      terminate_job
      return
    end
    # The job appears to be in progress.  Check to make sure it hasn't been killed in AWS.   But not too frequently.
    return unless due_for_aegea_check?
    self.job_status, self.job_log_id, job_hash, self.job_description = PipelineRunStage.job_info(job_id, id)
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
      Airbrake.notify("Job #{job_id} for pipeline run #{id} was killed #{MAX_RETRIES} times.")
      save
      return
    end
    run_job # this saves
  end

  def self.job_info(job_id, run_id)
    job_status = nil
    job_log_id = nil
    job_hash = nil
    stdout, stderr, status = Open3.capture3("aegea", "batch", "describe", job_id.to_s)
    if status.exitstatus.zero?
      job_description = stdout
      job_hash = JSON.parse(job_description)
      job_status = job_hash['status']
      if job_hash['container'] && job_hash['container']['logStreamName']
        job_log_id = job_hash['container']['logStreamName']
      end
    else
      Airbrake.notify("Error for update job status for pipeline run #{run_id} with error #{stderr}")
      job_status = STATUS_ERROR # transient error, job is still "in progress"
      job_status = STATUS_FAILED if stderr =~ /IndexError/ # job no longer exists
    end
    [job_status, job_log_id, job_hash, stdout]
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
    attribute_dict[:bucket] = Sample::SAMPLES_BUCKET_NAME
    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.erb",
                           sample.project_id,
                           sample.id,
                           sample.host_genome_name.downcase,
                           attribute_dict)
    self.dag_json = dag.render

    `echo '#{dag_json}' | aws s3 cp - #{dag_s3}`

    # Generate job command
    dag_path_on_worker = "/mnt/#{dag_name}.json"
    download_dag = "aws s3 cp #{dag_s3} #{dag_path_on_worker}"
    execute_dag = "idseq_dag #{key_s3_params} #{dag_path_on_worker}"
    copy_done_file = "echo done | aws s3 cp - #{sample.sample_output_s3_path}/\\$AWS_BATCH_JOB_ID.#{JOB_SUCCEEDED_FILE_SUFFIX}"
    [download_dag, execute_dag, copy_done_file].join(";")
  end

  def host_filtering_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    attribute_dict = {
      fastq1: sample.input_files[0].name,
      star_genome: sample.s3_star_index_path,
      bowtie2_genome: sample.s3_bowtie2_index_path,
      max_fragments: PipelineRun::MAX_INPUT_FRAGMENTS,
      max_subsample_frag: pipeline_run.subsample
    }
    attribute_dict[:fastq2] = sample.input_files[1].name if sample.input_files[1]
    dag_commands = prepare_dag("host_filter", attribute_dict)

    upload_version = "idseq_dag --version | cut -f2 -d ' ' | aws s3 cp  - #{pipeline_run.pipeline_version_file} "
    batch_command = [install_pipeline, upload_version, dag_commands].join("; ")

    # Dispatch job
    memory = sample.sample_memory.present? ? sample.sample_memory : Sample::DEFAULT_MEMORY_IN_MB
    aegea_batch_submit_command(batch_command, memory)
  end

  def alignment_command
    # Upload DAG to S3
    sample = pipeline_run.sample
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      input_file_count: sample.input_files.count,
      skip_dedeuterostome_filter: sample.skip_deutero_filter_flag,
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_run_version,
      index_dir_suffix: alignment_config.index_dir_suffix,
      lineage_db: alignment_config.s3_lineage_path,
      accession2taxid_db: alignment_config.s3_accession2taxid_path,
      deuterostome_db: alignment_config.s3_deuterostome_db_path
    }
    key_s3_params = "--key-path-s3 s3://idseq-secrets/idseq-prod.pem"
    dag_commands = prepare_dag("non_host_alignment", attribute_dict, key_s3_params)
    batch_command = [install_pipeline, dag_commands].join("; ")
    # Run it
    aegea_batch_submit_command(batch_command)
  end

  def postprocess_command
    # Upload DAG to S3
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_run_version,
      lineage_db: alignment_config.s3_lineage_path,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path
    }
    dag_commands = prepare_dag("postprocess", attribute_dict)
    batch_command = [install_pipeline, dag_commands].join("; ")
    # Run it
    aegea_batch_submit_command(batch_command)
  end

  def assembly_command
    # TODO: Change the following to DAG
    batch_command_env_variables = "ALIGNMENT_S3_PATH=#{pipeline_run.alignment_output_s3_path} " \
      "POSTPROCESS_S3_PATH=#{pipeline_run.postprocess_output_s3_path} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline assembly"
    "aegea batch submit --command=\"#{batch_command}\" " \
      " --storage /mnt=#{Sample::DEFAULT_STORAGE_IN_GB} --ecr-image idseq_dag --memory 60000 --queue idseq_assembly --vcpus 32 --job-role idseq-pipeline "
  end
end
