class WorkflowRun < ApplicationRecord
  # WorklfowRun model manages the run of a generic workflow type through our pipeline
  # and access to the results
  # WorkflowRun includes a *deprecated* attribute. Notes on deprecation:
  # * Deprecated runs are runs that were rerun, and superseded by other runs.
  # * Deprecated runs make it easier to select active runs (`where(deprecated: false)`),
  #   as opposed to having to sort by execution.
  # * The benefits are even more obvious if we start supporting multiple workflow runs per sample.
  #   In that case, the date of execution would not be enough to identify valid runs.
  # * For views that require all the versions, the deprecated field can be ignored.
  #   The wdl_version and executed_at fields might be used to select the relevant runs in that case.
  include PipelineOutputsHelper

  belongs_to :sample

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

  INPUT_ERRORS = {
    "InvalidInputFileError" => "There was an error parsing one of the input files.",
    "InsufficientReadsError" => "The number of reads after filtering was insufficient for further analysis.",
    "BrokenReadPairError" => "There were too many discordant read pairs in the paired-end sample.",
    "InvalidFileFormatError" => "The input file you provided has a formatting error in it.",
  }.freeze

  validates :status, inclusion: { in: STATUS.values }

  scope :consensus_genomes, -> { where(workflow: WORKFLOW[:consensus_genome]) }

  class RerunDeprecatedWorkflowError < StandardError
    def initialize
      super("Cannot rerun deprecated workflow runs.")
    end
  end

  def dispatch
    if workflow == WORKFLOW[:consensus_genome]
      SfnCGPipelineDispatchService.call(self)
    end
  end

  def workflow_version_tag
    return "#{workflow}-v#{wdl_version}"
  end

  def sfn_description
    # Added for `consensus_genome_zip_link` in samples_controller.
    # TODO: Consider removing it when reactored
    sfn_execution.description
  end

  def update_status
    remote_status = sfn_execution.description[:status]
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

  def output(output_key)
    path = sfn_execution.output_path(output_key)
    return S3Util.get_s3_file(path)
  end

  def rerun
    raise RerunDeprecatedWorkflowError if deprecated?
    update!(deprecated: true)
    sample.create_and_dispatch_workflow_run(workflow, rerun_from: id)
  end

  def self.in_progress(workflow_name = nil)
    scope = where(status: STATUS[:running])
    scope = scope.where(workflow: workflow_name) if workflow_name.present?
    scope
  end

  def self.viewable(user)
    where(sample: Sample.viewable(user))
  end

  private

  def sfn_execution
    @sfn_execution ||= SfnExecution.new(sfn_execution_arn, sample.sample_output_s3_path)
  end
end
