class SfnPipelineService
  # This service is responsible for dispatching a request to the
  # StepFunctions-based pipeline.
  # It generates jsons for all the pipeline run stages, converts them to WDL,
  # creates the Step Function's input JSON and start SFN execution

  include Callable

  def initialize(pipeline_run)
    @pipeline_run = pipeline_run
    @sample = pipeline_run.sample
    @aws_account_id = retrieve_aws_account
  end

  def retrieve_aws_account
    client = Aws::STS::Client.new
    resp = client.get_caller_identity
    return resp[:account]
  end

  def call
    stage_dags_json = generate_dag_stages_json
    sfn_input_json = generate_wdl_input(stage_dags_json)
    return {
      stage_dags_json: stage_dags_json,
      sfn_input_json: sfn_input_json,
      sfn_arn: sfn_arn,
    }
  end

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

  def convert_dag_json_to_wdl(dag_json)
    dag_tmp_file = Tempfile.new
    dag_tmp_file.write(JSON.dump(dag_json))
    dag_tmp_file.close
    stdout, stderr, status = Open3.capture3(
      {
        "AWS_ACCOUNT_ID" => @aws_account_id,
        "AWS_DEFAULT_REGION" => AwsUtil::AWS_REGION,
      },
      "app/jobs/idd2wdl.py",
      dag_tmp_file.path
    )
    if status.success?
      return stdout
    end
    LogUtil.log_err_and_airbrake("Command to convert dag to wdl failed ('idd2wdl.py'). Error: #{stderr}")
    return nil
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

    S3Util.upload_to_s3(SAMPLES_BUCKET_NAME, dag_json_input_s3_key, JSON.dump(stage_dag_json))
    S3Util.upload_to_s3(SAMPLES_BUCKET_NAME, wdl_input_s3_key, JSON.dump(stage_wdl))

    # Does not include the dag json path, since it will be used solely for debug
    return {
      wdl_input_s3_path: "s3://#{SAMPLES_BUCKET_NAME}/#{wdl_input_s3_key}",
      wdl_output_s3_path: "s3://#{SAMPLES_BUCKET_NAME}/#{wdl_output_s3_key}",
    }
  end

  def dispatch(sfn_input_json)
    sfn_name = "idseq-#{Time.now.to_i}"
    sfn_input = JSON.dump(sfn_input_json)
    sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_ARN)

    # Not using SDK because aws-sdk-sfn is currently on version 1.0.0.rc4,
    # which in terms requires aws-sdk-core (= 3.0.0.rc1)
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
        symbolize_name: true
      )
      return response[:execution_arn]
    else
      LogUtil.log_err_and_airbrake("Command to start SFN execution failed. Error: #{stderr}")
    end
  end
end
