class SfnPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # StepFunctions-based pipeline.
  # It generates jsons for all the pipeline run stages, converts them to WDL,
  # creates the Step Function's input JSON and start SFN execution

  include Callable

  ENV_TO_DEPLOYMENT_STAGE_NAMES = {
    "development" => "dev",
    "staging" => "staging",
    "prod" => "production",
  }.freeze

  class PipelineVersionMissingError < StandardError
    def initialize
      super("Pipeline Version not set on App Config")
    end
  end
  class Idd2WdlError < StandardError
    def initialize(error)
      super("Command to convert dag to wdl failed ('idd2wdl.py'). Error: #{error}")
    end
  end

  def initialize(pipeline_run)
    @pipeline_run = pipeline_run
    @sample = pipeline_run.sample
    @aws_account_id = retrieve_aws_account
  end

  def retrieve_aws_account
    sts_client = Aws::STS::Client.new
    resp = sts_client.get_caller_identity
    return resp[:account]
  end

  def call
    # Make sure a version is defined and enforce it on the pipeline run. Although not strictly required since
    # the SFN pipeline ignores this value, there are several features that depend on
    # the version, so better to fail the sample.
    # The JSON generation currently depends on setting this value, so just for backward compatibility we enforce it.
    # TODO: this is temporary for v0; this value needs to be manually syncronized with the server
    pipeline_version = AppConfigHelper.get_app_config(AppConfig::SFN_PIPELINE_VERSION)
    raise PipelineVersionMissingError if pipeline_version.blank?
    @pipeline_run.update(pipeline_version: pipeline_version)

    stage_dags_json = generate_dag_stages_json
    sfn_input_json = generate_wdl_input(stage_dags_json)
    sfn_arn = dispatch(sfn_input_json)
    return {
      pipeline_version: pipeline_version,
      stage_dags_json: stage_dags_json,
      sfn_input_json: sfn_input_json,
      sfn_arn: sfn_arn,
    }
  end

  private

  def generate_dag_stages_json
    # For compatibility with the legacy DAG json.
    # Generates a JSON composed by the jsons of all four stages in the DAG pipeline.
    stages_json = {}
    @pipeline_run.pipeline_run_stages.order(:step_number).each do |prs|
      stage_info = PipelineRunStage::STAGE_INFO[prs.step_number]
      stages_json[stage_info[:dag_name]] = JSON.parse(prs.send(stage_info[:json_generation_func]))
    end
    return stages_json
  end

  def save_dag_json(stage_dag_jsons)
    @pipeline_run.pipeline_run_stages.order(:step_number).each do |prs|
      stage_info = PipelineRunStage::STAGE_INFO[prs.step_number]
      prs.update(dag_json: stage_dag_jsons[stage_info[:dag_name]])
    end
  end

  def convert_dag_json_to_wdl(dag_json)
    dag_tmp_file = Tempfile.new
    dag_tmp_file.write(JSON.dump(dag_json))
    dag_tmp_file.close

    stdout, stderr, status = Open3.capture3(
      {
        "AWS_ACCOUNT_ID" => @aws_account_id,
        "AWS_DEFAULT_REGION" => ENV['AWS_REGION'],
        "STAGE" => ENV_TO_DEPLOYMENT_STAGE_NAMES[Rails.env],
      },
      "app/jobs/idd2wdl.py",
      "--name", dag_json['name'].to_s,
      "--pipeline-version", @pipeline_run.pipeline_version,
      dag_tmp_file.path
    )
    return stdout if status.success?
    raise Idd2WdlError, stderr
  ensure
    dag_tmp_file.unlink if dag_tmp_file
  end

  def generate_wdl_input(stage_dags_json)
    input_files_paths = @sample.input_files.map do |input_file|
      File.join(@sample.sample_input_s3_path, input_file.source)
    end
    sfn_pipeline_input_json = {
      Input: {
        HostFilter: input_files_paths.each_with_index.map { |path, i| ["fastqs_#{i}", path] }.to_h,
      },
    }

    stage_dags_json.each_pair do |stage_name, stage_dag_json|
      stage_wdl = convert_dag_json_to_wdl(stage_dag_json)
      s3_paths = upload_inputs_and_generate_paths(stage_name, stage_wdl, stage_dag_json)
      sfn_pipeline_input_json["#{stage_name.upcase}_WDL_URI"] = s3_paths[:wdl_input_s3_path]
      sfn_pipeline_input_json["#{stage_name.upcase}_OUTPUT_URI"] = s3_paths[:wdl_output_s3_path]
    end
    return sfn_pipeline_input_json
  end

  def upload_inputs_and_generate_paths(stage_name, stage_wdl, stage_dag_json)
    samples_prefix = "samples/#{@sample.project.id}/#{@sample.id}"
    wdl_s3_prefix = "#{samples_prefix}/sfn-wdl"
    wdl_input_s3_key = "#{wdl_s3_prefix}/#{stage_name}.wdl"
    wdl_output_s3_key = "#{wdl_s3_prefix}/#{stage_name}/output.json"
    # Temporary file for debugging purposes
    dag_json_input_s3_key = "#{wdl_s3_prefix}/#{stage_name}.dag.json"

    S3Util.upload_to_s3(ENV['SAMPLES_BUCKET_NAME'], dag_json_input_s3_key, JSON.dump(stage_dag_json))
    S3Util.upload_to_s3(ENV['SAMPLES_BUCKET_NAME'], wdl_input_s3_key, stage_wdl)

    # Does not include the dag json path, since it will be used solely for debug
    return {
      wdl_input_s3_path: "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{wdl_input_s3_key}",
      wdl_output_s3_path: "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{wdl_output_s3_key}",
    }
  end

  def dispatch(sfn_input_json)
    sfn_name = "idseq-#{Rails.env}-#{@sample.project_id}-#{@sample.id}-#{@pipeline_run.id}-#{Time.now.to_i}"
    sfn_input = JSON.dump(sfn_input_json)
    sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_ARN)

    # Not using SDK because aws-sdk-sfn is currently on version 1.0.0.rc4,
    # which in terms requires aws-sdk-core (= 3.0.0.rc1 which is lower than current version
    # and just an rc version).
    # Leaving the code as a reference for when dependencies are more open and reliable.
    #
    # sfn_client = Aws::SFN::Client.new
    # resp = sfn_client.start_execution({
    #   state_machine_arn: AppConfigHelper.get_app_config(AppConfig::SFN_ARN),
    #   name: "idseq-#{Time.now.to_i}",
    #   input: JSON.dump(sfn_input_json)
    # })
    # return resp[:execution_arn]

    stdout, stderr, status = Open3.capture3(
      "aws", "stepfunctions", "start-execution",
      "--name", sfn_name,
      "--input", sfn_input,
      "--state-machine-arn", sfn_arn
    )
    if status.success?
      response = JSON.parse(
        stdout,
        symbolize_names: true
      )
      return response[:executionArn]
    else
      LogUtil.log_err_and_airbrake("Command to start SFN execution failed. Error: #{stderr}")
    end
  end
end
