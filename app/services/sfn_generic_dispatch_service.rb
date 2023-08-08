class SfnGenericDispatchService
  # This service is responsible for dispatching a request to the
  # SFN pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_SINGLE_WDL_ARN and SFN_AMR_ARN not set on App Config.")
    end
  end

  class WdlFileNameMissingError < StandardError
    def initialize
      super("WDL file name not initialized to anything")
    end
  end

  class SfnVersionMissingError < StandardError
    def initialize(workflow)
      super("WDL version for '#{workflow}' not set.")
    end
  end

  def initialize(workflow_name, inputs_json, output_prefix, wdl_file_name: nil, version: nil)
    @workflow_name = workflow_name
    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = version || AppConfigHelper.get_workflow_version(workflow_name)
    raise SfnVersionMissingError, workflow_name if @wdl_version.blank?

    @wdl_file_name = wdl_file_name || @workflow_name
    raise WdlFileNameMissingError if @wdl_file_name.blank?

    @inputs_json = inputs_json
    @output_prefix = output_prefix
  end

  def call
    sfn_input_json = generate_wdl_input
    sfn_execution_arn = dispatch(sfn_input_json)

    if sfn_execution_arn.blank?
      @workflow_run.update(
        status: WorkflowRun::STATUS[:failed]
      )
      LogUtil.log_error(
        "Error starting #{@workflow_name} SFN pipeline"
      )
      raise
    else
      Rails.logger.info("SFN pipeline #{@workflow_name} started with sfn_execution_arn=#{sfn_execution_arn}")
    end
    return {
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  rescue StandardError => err
    # Set to failed and re-raise
    LogUtil.log_error(
      "Error starting SFN pipeline for #{workflow_name} workflow: #{err}",
      exception: err,
      sfn_execution_arn: sfn_execution_arn
    )
    raise
  end

  private

  def retrieve_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/#{@workflow_name}:v#{@wdl_version}"
  end

  def generate_wdl_input
    # SECURITY: To mitigate pipeline command injection, ensure any interpolated string inputs are either validated or controlled by the server.

    inputs_json = @inputs_json

    run_inputs = {
      docker_image_id: retrieve_docker_image_id,
    }.merge(inputs_json)

    sfn_pipeline_input_json = {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_name}-v#{@wdl_version}/#{@wdl_file_name}.wdl.zip", # TODO: generalize this
      Input: {
        Run: run_inputs,
      },
      OutputPrefix: @output_prefix,
    }
    return sfn_pipeline_input_json
  end

  def dispatch(sfn_input_json)
    sfn_name = "czid-#{Rails.env}-#{@sample.project_id}-#{@sample.id}-#{@workflow_name}-#{Time.zone.now.strftime('%Y%m%d%H%M%S')}" # TODO: make this work for all workflow runs
    sfn_input = JSON.dump(sfn_input_json)
    resp = AwsClient[:states].start_execution(state_machine_arn: @sfn_arn,
                                              name: sfn_name,
                                              input: sfn_input)
    return resp[:execution_arn]
  end
end
