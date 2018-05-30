class PipelineRunStage < ApplicationRecord
  include ApplicationHelper
  include PipelineOutputsHelper
  belongs_to :pipeline_run

  JOB_TYPE_BATCH = 1
  COMMIT_SHA_FILE_ON_WORKER = "/mnt/idseq-pipeline/commit-sha.txt".freeze

  STATUS_STARTED = 'STARTED'.freeze
  STATUS_FAILED  = 'FAILED'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_LOADED = 'LOADED'.freeze
  STATUS_ERROR = 'ERROR'.freeze
  STATUS_SUCCEEDED = 'SUCCEEDED'.freeze

  # Status file parameters for integration with pipeline
  JOB_SUCCEEDED = "succeeded".freeze
  JOB_FAILED = "failed".freeze

  # Stage names
  HOST_FILTERING_STAGE_NAME = 'Host Filtering'.freeze
  ALIGNMENT_STAGE_NAME = 'GSNAPL/RAPSEARCH alignment'.freeze
  POSTPROCESS_STAGE_NAME = 'Post Processing'.freeze

  # Max number of times we resubmit a job when it gets killed by EC2.
  MAX_RETRIES = 5

  def install_pipeline
    "pip install --upgrade git+git://github.com/chanzuckerberg/s3mi.git; " \
    "cd /mnt; " \
    "git clone https://github.com/chanzuckerberg/idseq-pipeline.git; " \
    "cd idseq-pipeline; " \
    "git checkout #{pipeline_run.pipeline_commit}; " \
    "echo #{pipeline_run.pipeline_commit} > #{COMMIT_SHA_FILE_ON_WORKER}; " \
    "pip install -e .[test]"
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
    command += " --storage /mnt=#{Sample::DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{memory} --queue #{queue} --vcpus #{vcpus} --job-role idseq-pipeline "
    command
  end

  def started?
    job_command.present?
  end

  def stage_status_file(status)
    basename = "#{job_id}.#{status}"
    s3_folder = case name
                when HOST_FILTERING_STAGE_NAME
                  pipeline_run.host_filter_output_s3_path
                when ALIGNMENT_STAGE_NAME
                  pipeline_run.alignment_output_s3_path
                when POSTPROCESS_STAGE_NAME
                  pipeline_run.postprocess_output_s3_path
                end
    "#{s3_folder}/#{basename}"
  end

  def assess_and_update(status_file_suffix, job_status_value)
    # Return whether stage exited exited with status_file_suffix
    # AND, if so, record the corresponding job_status_value in the database if it is not there already
    answer = pipeline_run.file_generated_since_run(stage_status_file(status_file_suffix))
    if answer && job_status != job_status_value
      update(job_status: job_status_value)
    end
    answer
  end

  def succeeded?
    assess_and_update(JOB_SUCCEEDED, STATUS_SUCCEEDED)
  end

  def failed?
    assess_and_update(JOB_FAILED, STATUS_FAILED)
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
    if failed? || succeeded?
      terminate_job
      return
    end
    # The job appears to be in progress.  Check to make sure it hasn't been killed in AWS.   But not too frequently.
    return unless due_for_aegea_check?
    stdout, stderr, status = Open3.capture3("aegea", "batch", "describe", job_id.to_s)
    unless status.exitstatus.zero?
      Airbrake.notify("Error for update job status for pipeline run #{id} with error #{stderr}")
      self.job_status = STATUS_ERROR # transient error, job is still "in progress"
      self.job_status = STATUS_FAILED if stderr =~ /IndexError/ # job no longer exists
      save
      return
    end
    self.job_description = stdout
    job_hash = JSON.parse(job_description)
    self.job_status = job_hash['status']
    if job_hash['container'] && job_hash['container']['logStreamName']
      self.job_log_id = job_hash['container']['logStreamName']
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

  def terminate_job
    _stdout, _stderr, _status = Open3.capture3("aegea", "batch", "terminate", job_id.to_s)
  end

  def log_url
    return nil unless job_log_id
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=/aws/batch/job;stream=#{job_log_id}"
  end

  ########### STAGE SPECIFIC FUNCTIONS BELOW ############

  def host_filtering_command
    sample = pipeline_run.sample
    file_type = sample.input_files.first.file_type
    batch_command_env_variables = "INPUT_BUCKET=#{sample.sample_input_s3_path} OUTPUT_BUCKET=#{sample.sample_output_s3_path} " \
      "FILE_TYPE=#{file_type} DB_SAMPLE_ID=#{sample.id} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    if sample.s3_star_index_path.present?
      batch_command_env_variables += " STAR_GENOME=#{sample.s3_star_index_path} "
    end
    if sample.s3_bowtie2_index_path.present?
      batch_command_env_variables += " BOWTIE2_GENOME=#{sample.s3_bowtie2_index_path} "
    end
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline host_filtering"
    memory = sample.sample_memory.present? ? sample.sample_memory : Sample::DEFAULT_MEMORY_IN_MB
    aegea_batch_submit_command(batch_command, memory)
  end

  def alignment_command
    sample = pipeline_run.sample
    file_type = sample.input_files.first.file_type
    batch_command_env_variables = "FASTQ_BUCKET=#{sample.sample_input_s3_path} INPUT_BUCKET=#{pipeline_run.host_filter_output_s3_path} " \
      "OUTPUT_BUCKET=#{pipeline_run.alignment_output_s3_path} FILE_TYPE=#{file_type} ENVIRONMENT=#{Rails.env} DB_SAMPLE_ID=#{sample.id} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} SKIP_DEUTERO_FILTER=#{sample.skip_deutero_filter_flag} "
    batch_command_env_variables += "SUBSAMPLE=#{pipeline_run.subsample} " if pipeline_run.subsample
    batch_command_env_variables += "HOST_FILTER_PIPELINE_VERSION=#{pipeline_run.pipeline_version} " if pipeline_run.pipeline_version
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline non_host_alignment"
    aegea_batch_submit_command(batch_command)
  end

  def postprocess_command
    batch_command_env_variables = "INPUT_BUCKET=#{pipeline_run.alignment_output_s3_path} " \
      "OUTPUT_BUCKET=#{pipeline_run.postprocess_output_s3_path} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline postprocess"
    aegea_batch_submit_command(batch_command, Sample::HOST_FILTERING_MEMORY_IN_MB) # HACK: it just needs more vCPUs
  end

  def assembly_command
    batch_command_env_variables = "ALIGNMENT_S3_PATH=#{pipeline_run.alignment_output_s3_path} " \
      "POSTPROCESS_S3_PATH=#{pipeline_run.postprocess_output_s3_path} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline assembly"
    "aegea batch submit --command=\"#{batch_command}\" " \
      " --storage /mnt=#{Sample::DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory 60000 --queue idseq_assembly --vcpus 32 --job-role idseq-pipeline "
  end
end
