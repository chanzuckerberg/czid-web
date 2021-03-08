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

  class WetlabProtocolMissingError < StandardError
    def initialize
      super("Wetlab Protocol not found in inputs_json.")
    end
  end

  class InvalidTechnologyError < StandardError
    def initialize(technology)
      # TODO: raise this error once technology is added as wdl input
      super("Technology #{technology} not recognized.")
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
  rescue StandardError => err
    # Set to failed and re-raise
    @workflow_run.update(status: WorkflowRun::STATUS[:failed])
    LogUtil.log_error(
      "Error starting CG SFN pipeline for WorkflowRun #{@workflow_run.id}: #{err}",
      exception: err,
      workflow_run_id: @workflow_run.id,
      sfn_execution_arn: sfn_execution_arn
    )
    raise
  end

  private

  def retrieve_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    # TODO(JIRA:IDSEQ-3164): do not use hardcoded docker image
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/idseq-consensus-genome:v#{@workflow_run.wdl_version}"
  end

  def technology
    if ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT.value?(@workflow_run.inputs&.[]("technology"))
      return @workflow_run.inputs&.[]("technology")
    end
    # TODO: raise an error if technology is not provided or is not a valid option
  end

  def primer_file
    protocols = ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL

    case @workflow_run.inputs&.[]("wetlab_protocol")
    when protocols[:ampliseq]
      "ampliseq_primers.bed"
    when protocols[:artic]
      "artic_v3_primers.bed"
    when protocols[:combined_msspe_artic]
      "combined_msspe_artic_primers.bed"
    when protocols[:msspe]
      "msspe_primers.bed"
    when protocols[:snap]
      "snap_primers.bed"
    else
      raise WetlabProtocolMissingError
    end
  end

  def alignment_config_paths
    alignment_config = AlignmentConfig.find_by(name: AlignmentConfig::DEFAULT_NAME)
    paths = {
      s3_nr_db_path: alignment_config.s3_nr_db_path,
      s3_nr_loc_db_path: alignment_config.s3_nr_loc_db_path,
    }
    paths
  end

  def generate_wdl_input
    additional_inputs = if technology == ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore]
                          # ONT sars-cov-2 cg
                          {
                            technology: technology,
                            medaka_model: @workflow_run.inputs&.[]("medaka_model"),
                            vadr_options: @workflow_run.inputs&.[]("vadr_options"),
                          }
                        elsif @workflow_run.inputs&.[]("accession_id")
                          # illumina gen viral cg
                          {
                            accession_id: @workflow_run.inputs&.[]("accession_id"),
                            s3_nr_db_path: alignment_config_paths[:s3_nr_db_path],
                            s3_nr_loc_db_path: alignment_config_paths[:s3_nr_loc_db_path],
                          }
                        else
                          # illumina sars-cov-2 cg
                          {
                            ref_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/MN908947.3.fa",
                            primer_bed: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/#{primer_file}",
                          }
                        end

    run_inputs = {
      docker_image_id: retrieve_docker_image_id,
      fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
      fastqs_1: @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil,
      sample: @sample.name,
      ref_host: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/hg38.fa.gz",
      kraken2_db_tar_gz: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/kraken_coronavirus_db_only.tar.gz",
      ercc_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/ercc_sequences.fasta",
    }.merge(additional_inputs)

    sfn_pipeline_input_json = {
      # TODO(JIRA:IDSEQ-3163): do not use hardcoded version (outputs will still be here in the SFN version returned by the tag)
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_run.workflow_version_tag}/run.wdl",
      Input: {
        Run: run_inputs,
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
