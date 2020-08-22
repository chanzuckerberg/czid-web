class SfnCGPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # Consensus Genomes Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_CG_ARN not set on App Config.")
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

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_CG_ARN)
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
        sfn_execution_arn: sfn_execution_arn,
        status: WorkflowRun::STATUS[:running]
      )
      Rails.logger.info("WorkflowRun: id=#{@workflow_run.id} sfn_execution_arn=#{sfn_execution_arn}")
    end

    return {
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  rescue => err
    # Set to failed and re-raise
    @workflow_run.update(status: WorkflowRun::STATUS[:failed])
    LogUtil.log_err_and_airbrake("Error starting CG SFN pipeline for WorkflowRun #{@workflow_run.id}: #{err}")
    LogUtil.log_backtrace(err)
    raise
  end

  private

  def retrieve_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    # TODO(JIRA:IDSEQ-3164): do not use hardcoded docker image
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/idseq-consensus-genome:v#{@workflow_run.wdl_version}"
  end

  def primer_file
    case @sample.temp_wetlab_protocol
    when Sample::TEMP_WETLAB_PROTOCOL[:msspe]
      "msspe_primers.bed"
    when Sample::TEMP_WETLAB_PROTOCOL[:artic]
      "artic_v3_primers.bed"
    else
      "msspe_primers.bed"
    end
  end

  def generate_wdl_input
    sfn_pipeline_input_json = {
      # TODO(JIRA:IDSEQ-3163): do not use hardcoded version (outputs will still be here in the SFN version returned by the tag)
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_run.workflow_version_tag}/run.wdl",
      Input: {
        Run: {
          docker_image_id: retrieve_docker_image_id,
          fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
          fastqs_1: @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil,
          sample: @sample.name,
          ref_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/MN908947.3.fa",
          ref_host: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/hg38.fa.gz",
          kraken2_db_tar_gz: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/kraken_coronavirus_db_only.tar.gz",
          primer_bed: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/#{primer_file}",
          ercc_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/ercc_sequences.fasta",
        },
      },
      OutputPrefix: @sample.sample_output_s3_path,
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
