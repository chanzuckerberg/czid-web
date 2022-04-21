class WorkflowRun < ApplicationRecord
  # WorkflowRun model manages the run of a generic workflow type through our
  # pipeline and access to the results.
  #
  # WorkflowRun includes a *deprecated* attribute. Notes on deprecation:
  # * Deprecated runs are runs that were rerun, and superseded by other runs.
  # * Deprecated runs make it easier to select active runs (`where(deprecated:
  #   false)`), as opposed to having to sort by execution.
  # * The benefits are even more obvious if we start supporting multiple
  #   workflow runs per sample. In that case, the date of execution would not be
  #   enough to identify valid runs.
  # * For views that require all the versions, the deprecated field can be
  #   ignored. The wdl_version and executed_at fields might be used to select
  #   the relevant runs in that case.
  #
  # Why keep deprecated runs at all?
  # * Main reason is for comparing before-and-after a rerun (e.g. seeing if a
  #   failed sample will now succeed, or seeing that a successful sample now
  #   fails, or comparing results before-and-after an index update). We just
  #   need somewhere to track the inputs, attributes, and log links, and the
  #   model record is a natural place.
  #
  # Why are reruns "idempotent" (creating new runs) instead of in-place
  # (updating the existing run)?
  # * It's easier to compare results with their full history and logs (e.g.
  #   seeing what changed).
  # * In-replace reruns often lead to trouble when only some fields are reset
  #   and not others, or inputs change subtly between reruns. For example this
  #   could happen in the context of S3 if old intermediate files are actually
  #   'dirty' and can't be reused. Another case could be if some statistic
  #   columns are updated but not others. This can be avoided by making sure to
  #   really reset everything, but in that case may as well create a new record.
  #
  # What should go into inputs_json?
  # * Include any WDL inputs that affect the results, but don't include other
  #   informational attributes like a sample ID. Secret fields should also not belong here.
  #
  # What should go into cached_results?
  # * Include simple outputs that you need to load quickly in a batch of runs.
  #   Don't include larger file-based outputs or outputs that can be loaded from
  #   S3 on-demand.
  include PipelineOutputsHelper

  belongs_to :sample
  before_destroy :cleanup

  WORKFLOW = {
    # NOTE: 'main' is not yet supported in WorkflowRuns.
    main: "main",
    consensus_genome: "consensus-genome",
    short_read_mngs: "short-read-mngs",
  }.freeze

  WORKFLOW_CLASS = {
    WORKFLOW[:consensus_genome] => ConsensusGenomeWorkflowRun,
  }.freeze

  STATUS = {
    created: "CREATED",
    running: "RUNNING",
    succeeded: "SUCCEEDED",
    succeeded_with_issue: "SUCCEEDED_WITH_ISSUE",
    failed: "FAILED",
  }.freeze

  # Maps SFN execution statuses to classic frontend statuses
  SFN_STATUS_MAPPING = {
    STATUS[:created] => "CREATED",
    STATUS[:running] => "RUNNING",
    STATUS[:succeeded] => "COMPLETE",
    STATUS[:succeeded_with_issue] => "COMPLETE - ISSUE",
    STATUS[:failed] => "FAILED",
  }.freeze

  INPUT_ERRORS = {
    "InvalidInputFileError" => "There was an error parsing one of the input files.",
    "InsufficientReadsError" => "The number of reads after filtering was insufficient for further analysis.",
    "BrokenReadPairError" => "There were too many discordant read pairs in the paired-end sample.",
    "InvalidFileFormatError" => "The input file you provided has a formatting error in it.",
  }.freeze

  # Constants related to sorting
  DATA_KEY_TO_SORT_KEY = {
    "createdAt" => "created_at",
    "ctValue" => "ct_value",
  }.freeze
  WORKFLOW_RUNS_SORT_KEYS = ["created_at"].freeze
  METADATA_SORT_KEYS = ["ct_value"].freeze
  TIEBREAKER_SORT_KEY = "id".freeze

  validates :status, inclusion: { in: STATUS.values }

  scope :by_time, ->(start_date:, end_date:) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :by_workflow, ->(workflow) { where(workflow: workflow) }
  scope :consensus_genomes, -> { where(workflow: WORKFLOW[:consensus_genome]) }
  scope :non_deprecated, -> { where(deprecated: false) }
  scope :active, -> { where(status: WorkflowRun::STATUS[:succeeded], deprecated: false) }
  scope :viewable, ->(user) { where(sample: Sample.viewable(user)) }
  scope :created_by, ->(user) { includes(:sample).where(samples: { user: user }) }

  class RerunDeprecatedWorkflowError < StandardError
    def initialize
      super("Cannot rerun deprecated workflow runs.")
    end
  end

  def dispatch
    if workflow == WORKFLOW[:consensus_genome]
      SfnCgPipelineDispatchService.call(self)
    end
  end

  def workflow_version_tag
    return "#{workflow}-v#{wdl_version}"
  end

  def update_status(remote_status = nil)
    remote_status ||= sfn_execution.description[:status]
    # Collapse failed status into our local unique failure status. Status retrieved from [2020/08/12]:
    # https://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html#API_DescribeExecution_ResponseSyntax
    if ["TIMED_OUT", "ABORTED", "FAILED"].include?(remote_status)
      remote_status = STATUS[:failed]
    end

    if remote_status == STATUS[:failed]
      if input_error.present?
        remote_status = STATUS[:succeeded_with_issue]
      else
        Rails.logger.error("SampleFailedEvent: Sample #{sample.id} by " \
        "#{sample.user.role_name} failed WorkflowRun #{id} (#{workflow}). See: #{sample.status_url}")
      end
      update(time_to_finalized: time_since_executed_at)
    elsif remote_status == STATUS[:succeeded]
      load_cached_results
      update(time_to_finalized: time_since_executed_at)
    end

    if remote_status != status
      update(status: remote_status)
    end
  end

  def input_error
    sfn_error = sfn_execution.error
    if INPUT_ERRORS.include?(sfn_error)
      return {
        label: sfn_error,
        message: INPUT_ERRORS[sfn_error],
      }
    end
  end

  def output_path(output_key)
    sfn_execution.output_path(output_key)
  end

  def output(output_key)
    path = output_path(output_key)
    return S3Util.get_s3_file(path)
  end

  def rerun
    raise RerunDeprecatedWorkflowError if deprecated?

    update!(deprecated: true)
    sample.create_and_dispatch_workflow_run(workflow, rerun_from: id, inputs_json: inputs_json)
  end

  # Generic misc inputs from inputs_json database field
  def inputs
    @inputs ||= JSON.parse(inputs_json || "null")
  end

  def get_input(input_name)
    inputs&.[](input_name)
  end

  def parsed_cached_results
    @parsed_cached_results ||= JSON.parse(cached_results || "null")
  end

  def finalized?
    [STATUS[:failed], STATUS[:succeeded], STATUS[:succeeded_with_issue]].include?(status)
  end

  def self.in_progress(workflow_name = nil)
    scope = where(status: STATUS[:running])
    scope = scope.where(workflow: workflow_name) if workflow_name.present?
    scope
  end

  def self.handle_sample_upload_failure(samples)
    # If the Sample Upload fails, assume that all runs in CREATED should be failed.
    WorkflowRun.where(sample: samples, status: WorkflowRun::STATUS[:created]).update_all(status: WorkflowRun::STATUS[:failed]) # rubocop:disable Rails/SkipsModelValidations
  end

  def self.handle_sample_upload_restart(sample)
    # Assumes that the latest failed run should be reset.
    WorkflowRun.where(sample: sample, status: WorkflowRun::STATUS[:failed]).order(created_at: :desc).first&.update(status: WorkflowRun::STATUS[:created])
  end

  # order_by stores a sortable column's dataKey (refer to: ColumnConfigurations.jsx)
  def self.sort_workflow_runs(workflow_runs, order_by, order_dir)
    sort_key = DATA_KEY_TO_SORT_KEY[order_by.to_s]
    workflow_runs = workflow_runs.order("#{sort_key} #{order_dir}, #{TIEBREAKER_SORT_KEY} #{order_dir}") if WORKFLOW_RUNS_SORT_KEYS.include?(sort_key)
    workflow_runs = WorkflowRun.sort_by_metadata_key(workflow_runs, sort_key, order_dir) if METADATA_SORT_KEYS.include?(sort_key)
    workflow_runs
  end

  def self.sort_by_metadata_key(workflow_runs, sort_key, order_dir)
    joins_statement = "
        LEFT JOIN samples ON workflow_runs.sample_id = samples.id
        LEFT JOIN metadata ON (samples.id = metadata.sample_id AND metadata.key = '#{sort_key}')
    "
    workflow_runs.joins(ActiveRecord::Base.send(:sanitize_sql_array, joins_statement))
                 .order("metadata.number_validated_value #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}")
  end

  private

  def cleanup
    prefix = s3_output_prefix || sample.sample_output_s3_path
    return if prefix.blank?

    S3Util.delete_s3_prefix(prefix)
  end

  def sfn_execution
    s3_path = s3_output_prefix || sample.sample_output_s3_path

    @sfn_execution ||= SfnExecution.new(execution_arn: sfn_execution_arn, s3_path: s3_path, finalized: finalized?)
  end

  def workflow_by_class
    becomes(WORKFLOW_CLASS[workflow])
  end

  # TODO: Consider refactoring with a different OOP approach or asynchronous results loading.
  # Use cached_results for simple outputs that need to be accessed quickly (e.g. in multi-WorkflowRun displays).
  # Don't use it for large or complex responses.
  def load_cached_results
    raise NotImplementedError unless workflow_by_class.respond_to?(:results)

    begin
      results = workflow_by_class.results(cacheable_only: true)
      update(cached_results: results.to_json)
    rescue ArgumentError
      raise NotImplementedError("Check that results support cacheable_only")
    rescue StandardError => exception
      LogUtil.log_error(
        "Error loading cached results",
        exception: exception,
        workflow_run_id: id
      )
      return nil
    end
  end

  def time_since_executed_at
    if executed_at
      Time.now.utc - executed_at  # seconds
    end
  end
end
