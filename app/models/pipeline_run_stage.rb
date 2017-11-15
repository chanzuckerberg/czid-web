class PipelineRunStage < ApplicationRecord
  belongs_to :pipeline_run
  DEFAULT_MEMORY_IN_MB = 4000
  DEFAULT_STORAGE_IN_GB = 100
  JOB_TYPE_BATCH = 1

  STATUS_STARTED = 'STARTED'.freeze
  STATUS_FAILED  = 'FAILED'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze

  before_save :check_job_status

  def check_job_status
    return if completed? || !started? || !id
    if output_ready?
      self.job_status = STATUS_CHECKED
      Resque.enqueue(LoadResultForRunStage, id)
      terminate_job
    end
  end

  def started?
    job_command.present?
  end

  def failed?
    job_status == STATUS_FAILED
  end

  def succeeded? # The whole thing completed successfully
    db_load_status == 1
  end

  def completed?
    failed? || succeeded?
  end

  def output_ready?
    s3_output_list = self.send(output_func)
    s3_output_list.each do |out_f|
      return false unless file_generated_since_run(out_f)
    end
    return true
  end

  def run_job
    # Check output for the run and decide if we should run this stage
    return if job_command.present? && job_status != 'FAILED' # job has been started successfully
    self.job_command = self.send(job_command_func)
    self.command_stdout, self.command_stderr, status = Open3.capture3(job_command)
    if status.exitstatus.zero?
      output =  JSON.parse(command_stdout)
      self.job_id = output['jobId']
      self.job_status = STATUS_STARTED
    else
      self.job_status = STATUS_FAILED
    end
    save
  end

  def run_load_db
    return unless output_ready?
    return if completed?
    self.send(load_db_command_func)
    self.update(db_load_status: 1)
  end

  def update_job_status
    return if completed?
    command = "aegea batch describe #{job_id}"
    stdout, stderr, status = Open3.capture3(command)
    if status.exitstatus.zero?
      self.job_description = stdout
      job_hash = JSON.parse(job_description)
      self.job_status = job_hash['status']
      if job_hash['container'] && job_hash['container']['logStreamName']
        self.job_log_id = job_hash['container']['logStreamName']
      end
    else
      Airbrake.notify("Error for update job status for pipeline run #{id} with error #{stderr}")
      self.job_status = STATUS_ERROR
      self.job_status = STATUS_FAILED if stderr =~ /IndexError/ # job no longer exists
    end
    save
  end

  def file_generated_since_run(s3_path)
    command = "aws s3 ls #{s3_path}"
    stdout, _stderr, status = Open3.capture3(command)
    return false unless status.exitstatus.zero?
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time > created_at)
    rescue
      return nil
    end
  end

  def terminate_job
    command = "aegea batch terminate #{job_id}"
    _stdout, _stderr, _status = Open3.capture3(command)
  end


  ########### STAGE SPECIFIC FUNCTIONS BELOW ############

  def host_filtering_command
  end

  def alignment_command
  end

  def postprocess_command
  end

  def db_load_host_filtering
  end

  def db_load_alignment
  end

  def db_load_postprocess
  end

  def host_filtering_outputs
  end

  def alignment_outputs
  end

  def postprocess_outputs
  end

end
