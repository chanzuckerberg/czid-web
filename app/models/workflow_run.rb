class WorkflowRun < ApplicationRecord
  include PipelineOutputsHelper

  belongs_to :sample

  WORKFLOW = {
    # NOTE: 'main' is not yet supported in WorkflowRuns.
    main: "main",
    consensus_genome: "consensus_genome",
  }.freeze

  STATUS = {
    created: "CREATED",
    running: "RUNNING",
    succeeded: "SUCCEEDED",
    succeeded_with_issue: "SUCCEEDED_WITH_ISSUE",
    failed: "FAILED",
  }.freeze

  validates :status, inclusion: { in: STATUS.values }

  def dispatch
    if workflow == WORKFLOW[:consensus_genome]
      SfnCGPipelineDispatchService.call(self)
    end
  end

  def self.in_progress(workflow_name = nil)
    scope = where(status: STATUS[:running])
    scope = scope.where(workflow: workflow_name) if workflow_name.present?
    scope
  end

  def update_status
    remote_status = sfn_description[:status]
    if ["TIMED_OUT", "ABORTED"].include?(remote_status)
      remote_status = STATUS[:failed]
    end

    if remote_status != status
      update(status: remote_status)
    end

    if remote_status == STATUS[:failed]
      LogUtil.log_err_and_airbrake("SampleFailedEvent: Sample #{sample.id} by " \
        "#{sample.user.role_name} failed WorkflowRun #{id} (#{workflow}). See: #{sample.status_url}")
    end
  end

  def sfn_description
    AwsClient[:states].describe_execution(execution_arn: sfn_execution_arn)
  rescue Aws::States::Errors::ExecutionDoesNotExist
    # Attention: Timestamp fields will be returned as strings
    description_json = get_s3_file("#{sample.sample_output_s3_path}/sfn-desc/#{sfn_execution_arn}")
    description_json && JSON.parse(description_json, symbolize_names: true)
  end
end
