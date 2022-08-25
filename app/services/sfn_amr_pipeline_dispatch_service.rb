class SfnAmrPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # AMR Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_SINGLE_WDL_ARN and SFN_AMR_ARN not set on App Config.")
    end
  end

  class SfnVersionMissingError < StandardError
    def initialize(workflow)
      super("WDL version for '#{workflow}' not set.")
    end
  end

  def initialize(workflow_run)
    @workflow_run = workflow_run
    @sample = workflow_run.sample

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN) || AppConfigHelper.get_app_config(AppConfig::SFN_AMR_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = AppConfigHelper.get_workflow_version(@workflow_run.workflow)
    raise SfnVersionMissingError, @workflow_run.workflow if @wdl_version.blank?

    @workflow_run.update(
      wdl_version: @wdl_version
    )
  end

  def call
    sfn_input_json = generate_wdl_input
    sfn_execution_arn = dispatch(sfn_input_json)

    if sfn_execution_arn.blank?
      @workflow_run.update(
        status: WorkflowRun::STATUS[:failed]
      )
    else
      @workflow_run.update(
        executed_at: Time.now.utc,
        s3_output_prefix: output_prefix,
        sfn_execution_arn: sfn_execution_arn,
        status: WorkflowRun::STATUS[:running]
      )
      Rails.logger.info("WorkflowRun: id=#{@workflow_run.id} sfn_execution_arn=#{sfn_execution_arn}")
    end

    return {
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  rescue StandardError => err
    # Set to failed and re-raise
    @workflow_run.update(status: WorkflowRun::STATUS[:failed])
    LogUtil.log_error(
      "Error starting AMR SFN pipeline for WorkflowRun #{@workflow_run.id}: #{err}",
      exception: err,
      workflow_run_id: @workflow_run.id,
      sfn_execution_arn: sfn_execution_arn
    )
    raise
  end

  private

  def retrieve_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/amr:v#{@workflow_run.wdl_version}"
  end

  def output_prefix
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample.sample_path}/#{@workflow_run.id}"
  end

  def generate_wdl_input
    # SECURITY: To mitigate pipeline command injection, ensure any interpolated string inputs are either validated or controlled by the server.

    run_inputs = {
      docker_image_id: retrieve_docker_image_id,
      non_host_reads: [
        "#{@sample.first_pipeline_run.sfn_results_path}/gsnap_filter_1.fa",
        "#{@sample.first_pipeline_run.sfn_results_path}/gsnap_filter_2.fa",
      ],
      contigs: "#{@sample.first_pipeline_run.sfn_results_path}/contigs.fasta",
    }

    sfn_pipeline_input_json = {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_run.workflow_version_tag}/run.wdl",
      Input: {
        Run: run_inputs,
      },
      OutputPrefix: output_prefix,
    }
    return sfn_pipeline_input_json
  end

  def dispatch(sfn_input_json)
    sfn_name = "idseq-#{Rails.env}-#{@sample.project_id}-#{@sample.id}-#{@workflow_run.id}-#{Time.zone.now.strftime('%Y%m%d%H%M%S')}"
    sfn_input = JSON.dump(sfn_input_json)
    resp = AwsClient[:states].start_execution(state_machine_arn: @sfn_arn,
                                              name: sfn_name,
                                              input: sfn_input)
    return resp[:execution_arn]
  end
end
