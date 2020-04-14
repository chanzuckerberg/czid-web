class SfnPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # StepFunctions-based pipeline.
  # It generates jsons for all the pipeline run stages, converts them to WDL,
  # creates the Step Function's input JSON and start SFN execution

  include Callable

  STS_CLIENT = Aws::STS::Client.new
  SFN_CLIENT = Aws::States::Client.new

  # Constains SFN deployment stage names that differ from Rails.env
  ENV_TO_DEPLOYMENT_STAGE_NAMES = {
    "development" => "dev",
    "prod" => "production",
  }.freeze

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN ARN not set on App Config")
    end
  end

  class SfnVersionTagsMissingError < StandardError
    def initialize(arn, tags)
      super("WDL version not set for SFN '#{arn}'. Tags missing: #{tags}")
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

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?
  end

  def call
    @sfn_tags = retrieve_version_tags
    @pipeline_run.update(pipeline_version: @sfn_tags[:dag_version])

    stage_dags_json = generate_dag_stages_json
    sfn_input_json = generate_wdl_input(stage_dags_json)
    sfn_execution_arn = dispatch(sfn_input_json)
    return {
      pipeline_version: @sfn_tags[:dag_version],
      stage_dags_json: stage_dags_json,
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  end

  private

  def retrieve_aws_account
    resp = STS_CLIENT.get_caller_identity
    return resp[:account]
  end

  def retrieve_version_tags
    resp = SFN_CLIENT.list_tags_for_resource(resource_arn: @sfn_arn)
    tags = resp.tags.reduce({}) do |h, tag|
      h.update(tag.key => tag.value)
    end.symbolize_keys

    missing_tags = [:wdl_version, :dag_version].select { |tag_name| tags[tag_name].blank? }
    raise SfnVersionTagsMissingError.new(@sfn_arn, missing_tags) if missing_tags.present?

    return tags
  end

  def stage_deployment_name
    return ENV_TO_DEPLOYMENT_STAGE_NAMES[Rails.env] || Rails.env
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

    idd2wdl_opts = [
      "--name", dag_json['name'].to_s,
      "--output-prefix",
      "--aws-account-id", @aws_account_id,
      "--deployment-env", stage_deployment_name,
      "--aws-region", ENV['AWS_REGION'],
      "--wdl-version", @sfn_tags[:wdl_version],
      "--dag-version", @sfn_tags[:dag_version],
    ]

    if @pipeline_run.pipeline_branch != "master"
      idd2wdl_opts += ["--dag-branch", @pipeline_run.pipeline_commit]
    end

    stdout, stderr, status = Open3.capture3(
      "app/jobs/idd2wdl.py",
      dag_tmp_file.path,
      *idd2wdl_opts
    )
    return stdout if status.success?
    raise Idd2WdlError, stderr
  ensure
    dag_tmp_file.unlink if dag_tmp_file
  end

  def generate_wdl_input(stage_dags_json)
    input_files_paths = @sample.input_files.map do |input_file|
      File.join(@sample.sample_input_s3_path, input_file.name)
    end
    sfn_pipeline_input_json = {
      Input: {
        HostFilter: input_files_paths.each_with_index.map { |path, i| ["fastqs_#{i}", path] }.to_h,
      },
      OutputPrefix: @sample.sample_output_s3_path,
    }

    stage_dags_json.each_pair do |stage_name, stage_dag_json|
      stage_wdl = convert_dag_json_to_wdl(stage_dag_json)
      s3_paths = upload_inputs_and_generate_paths(stage_name, stage_wdl, stage_dag_json)
      sfn_pipeline_input_json["#{stage_name.upcase}_WDL_URI"] = s3_paths[:wdl_input_s3_path]
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

    resp = SFN_CLIENT.start_execution(state_machine_arn: @sfn_arn,
                                      name: sfn_name,
                                      input: sfn_input)
    return resp[:execution_arn]
  end
end
