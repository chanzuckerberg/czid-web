class PipelineRunStage < ApplicationRecord
  include ApplicationHelper
  include PipelineRunsHelper
  include PipelineOutputsHelper

  belongs_to :pipeline_run
  validates :name, presence: true
  # TODO: (gdingle): rename to stage_number. See https://jira.czi.team/browse/IDSEQ-1912.
  validates :step_number, presence: true, numericality: { greater_than: 0, integer_only: true }
  validates :job_command_func, presence: true

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
  ALIGNMENT_STAGE_NAME = 'GSNAPL/RAPSEARCH2 alignment'.freeze
  POSTPROCESS_STAGE_NAME = 'Post Processing'.freeze # also known as "assembly"
  EXPT_STAGE_NAME = "Experimental".freeze # Not actually experimental anymore!

  # Dag Json names
  DAG_NAME_HOST_FILTER = "host_filter".freeze
  DAG_NAME_ALIGNMENT = "non_host_alignment".freeze
  DAG_NAME_POSTPROCESS = "postprocess".freeze
  DAG_NAME_EXPERIMENTAL = "experimental".freeze

  # Older alignment configs might not have an s3_nt_info_db_path field, so use a reasonable default in this case.
  DEFAULT_S3_NT_INFO_DB_PATH = "s3://#{S3_DATABASE_BUCKET}/alignment_data/#{AlignmentConfig::DEFAULT_NAME}/nt_info.db".freeze

  DAG_NAME_BY_STAGE_NAME = {
    HOST_FILTERING_STAGE_NAME => DAG_NAME_HOST_FILTER,
    ALIGNMENT_STAGE_NAME => DAG_NAME_ALIGNMENT,
    POSTPROCESS_STAGE_NAME => DAG_NAME_POSTPROCESS,
    EXPT_STAGE_NAME => DAG_NAME_EXPERIMENTAL,
  }.freeze

  STAGE_INFO = {
    1 => {
      name: HOST_FILTERING_STAGE_NAME,
      dag_name: DAG_NAME_BY_STAGE_NAME[HOST_FILTERING_STAGE_NAME],
      job_command_func: 'host_filtering_command'.freeze,
    },
    2 => {
      name: ALIGNMENT_STAGE_NAME,
      dag_name: DAG_NAME_BY_STAGE_NAME[ALIGNMENT_STAGE_NAME],
      job_command_func: 'alignment_command'.freeze,
    },
    3 => {
      name: POSTPROCESS_STAGE_NAME,
      dag_name: DAG_NAME_BY_STAGE_NAME[POSTPROCESS_STAGE_NAME],
      job_command_func: 'postprocess_command'.freeze,
    },
    4 => {
      name: EXPT_STAGE_NAME,
      dag_name: DAG_NAME_BY_STAGE_NAME[EXPT_STAGE_NAME],
      job_command_func: 'experimental_command'.freeze,
    },
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
    # TODO: (gdingle): rename to stage_number. See https://jira.czi.team/browse/IDSEQ-1912.
    DAG_NAME_BY_STAGE_NAME[name]
  end

  def step_status_file_path
    json_basename = "#{dag_name}_status.json"
    if pipeline_run.step_function?
      "#{pipeline_run.sfn_results_path}/#{json_basename}"
    else
      path_beginning = if step_number <= 2
                         pipeline_run.sample.sample_output_s3_path
                       else
                         pipeline_run.sample.sample_postprocess_s3_path
                       end
      "#{path_beginning}/#{pipeline_run.pipeline_version}/#{json_basename}"
    end
  end

  def step_statuses
    JSON.parse(S3Util.get_s3_file(step_status_file_path) || "{}")
  rescue JSON::ParserError
    {}
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

  def redacted_dag_json
    # redact any s3 paths
    dag_json.gsub(%r{(\"s3://).*(\")}, '"s3://..."')
  end

  def run_job
    # Check output for the run and decide if we should run this stage
    return if started? && !failed? # job has been started successfully

    # Only SFN runs supported
    if pipeline_run.sfn_execution_arn
      # We do not need to start stage anymore for SFNs, because now we only start
      # the step function which handles all stages (started in PipelineRun::update_job_status)
      # Filling job_command with placeholder string because current pipeline
      # depends on it (e.g. see started? method)
      self.job_command = pipeline_run.sfn_execution_arn
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

  def due_for_aegea_check?
    rand < 0.1
  end

  def update_job_status
    if pipeline_run.step_function?
      # this logic will be replaced soon by step functions async notifications (IDSEQ-2310)

      if !id || !pipeline_run.sfn_execution_arn
        LogUtil.log_error(
          "Invalid precondition for PipelineRunStage.update_job_status step_function #{id} #{pipeline_run.sfn_execution_arn} #{job_status}.",
          step_function_id: id,
          sfn_execution_arn: pipeline_run.sfn_execution_arn,
          job_status: job_status
        )
        return
      end
      self.job_status, self.job_log_id = sfn_info(pipeline_run.sfn_execution_arn, id, step_number)
      save!
      return
    end

    if !id || !started?
      LogUtil.log_error(
        "Invalid precondition for PipelineRunStage.update_job_status #{id} #{job_id} #{job_status}.",
        step_function_id: id,
        job_id: job_id,
        job_status: job_status
      )
      return
    end
    check_status_file_and_update(JOB_SUCCEEDED_FILE_SUFFIX, STATUS_SUCCEEDED)
    check_status_file_and_update(JOB_FAILED_FILE_SUFFIX, STATUS_FAILED)
    if failed? || succeeded?
      unless job_log_id
        # set log id if not set
        _job_status, self.job_log_id, self.job_description = job_info(job_id, id)
        save
      end
      return
    end
    # The job appears to be in progress.  Check to make sure it hasn't been killed in AWS.   But not too frequently.
    return unless due_for_aegea_check?

    self.job_status, self.job_log_id, self.job_description = job_info(job_id, id)
    save
  end

  def log_url
    return nil unless job_log_id

    AwsUtil.get_cloudwatch_url("/aws/batch/job", job_log_id)
  end

  # Gets the URL to the AWS console page of the batch job for display on
  # admin-only pages.
  def batch_job_status_url
    return if job_description.blank?

    job_hash = JSON.parse(job_description)
    if job_hash && job_hash['jobId']
      AwsUtil.get_batch_job_url(job_hash['jobQueue'], job_hash['jobId'])
    end
  end

  # Returns the exit reason of the AWS batch job. For example: "Essential
  # container in task exited".
  def batch_job_status_reason
    return if job_description.blank?

    job_hash = JSON.parse(job_description)
    if job_hash
      job_hash['statusReason']
    end
  end
end
