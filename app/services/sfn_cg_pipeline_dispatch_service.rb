class SfnCgPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # Consensus Genomes Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  NA_PRIMER_FILE = "na_primers.bed".freeze

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_SINGLE_WDL_ARN and SFN_CG_ARN not set on App Config.")
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

  class InvalidWetlabProtocolError < StandardError
    def initialize(protocol, technology)
      super("Protocol #{protocol} is not supported for technology #{technology}.")
    end
  end

  class InvalidTechnologyError < StandardError
    def initialize(technology)
      super("Technology #{technology} not recognized.")
    end
  end

  class TechnologyMissingError < StandardError
    def initialize
      super("Technology not found in inputs_json.")
    end
  end

  class InvalidMedakaModelError < StandardError
    def initialize
      super("Medaka model option not recognized.")
    end
  end

  def initialize(workflow_run)
    @workflow_run = workflow_run
    @sample = workflow_run.sample

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN) || AppConfigHelper.get_app_config(AppConfig::SFN_CG_ARN)
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
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/consensus-genome:v#{@workflow_run.wdl_version}"
  end

  def technology
    wr_technology = @workflow_run.inputs&.[]("technology")
    raise TechnologyMissingError if wr_technology.nil?

    if ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT.value?(wr_technology)
      wr_technology
    else
      raise InvalidTechnologyError, technology
    end
  end

  def medaka_model
    wr_medaka_model = @workflow_run.inputs&.[]("medaka_model")

    if ConsensusGenomeWorkflowRun::MEDAKA_MODEL_OPTIONS.include?(wr_medaka_model)
      wr_medaka_model
    else
      raise InvalidMedakaModelError
    end
  end

  def apply_length_filter
    # apply_length_filter should be true by default, and false for ClearLabs samples
    !@workflow_run.inputs&.[]("clearlabs")
  end

  def illumina_primer_file
    protocols = ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL

    case @workflow_run.inputs&.[]("wetlab_protocol")
    when protocols[:ampliseq]
      "ampliseq_primers.bed"
    when protocols[:artic]
      "artic_v3_primers.bed"
    when protocols[:combined_msspe_artic]
      "combined_msspe_artic_primers.bed"
    when protocols[:covidseq]
      "covidseq_primers.bed"
    when protocols[:msspe]
      "msspe_primers.bed"
    when protocols[:snap]
      "snap_primers.bed"
    when protocols[:artic_short_amplicons]
      "artic_v3_short_275_primers.bed"
    when protocols[:artic_v4]
      "artic_v4_primers.bed"
    when protocols[:varskip]
      "neb_vss1a.primer.bed"
    when protocols[:easyseq]
      "easyseq.bed"
    when protocols[:midnight]
      "midnight_primers.bed"
    else
      raise WetlabProtocolMissingError
    end
  end

  def nanopore_primer_set
    protocols = ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL

    case @workflow_run.inputs&.[]("wetlab_protocol")
    when protocols[:artic]
      "nCoV-2019/V3"
    when protocols[:midnight]
      "nCoV-2019/V1200"
    when protocols[:artic_v4]
      "nCoV-2019/V4"
    when protocols[:varskip]
      "NEB_VarSkip/V1a"
    else
      if @workflow_run.inputs&.[]("wetlab_protocol")
        raise InvalidWetlabProtocolError.new(@workflow_run.inputs&.[]("wetlab_protocol"), technology)
      else
        raise WetlabProtocolMissingError
      end
    end
  end

  def output_prefix
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample.sample_path}/#{@workflow_run.id}"
  end

  def generate_wdl_input
    # SECURITY: To mitigate pipeline command injection, ensure any interpolated string inputs are either validated or controlled by the server.
    additional_inputs = if technology == ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore]
                          # ONT sars-cov-2 cg
                          {
                            apply_length_filter: apply_length_filter,
                            medaka_model: medaka_model,
                            vadr_options: @workflow_run.inputs&.[]("vadr_options"),
                            # Remove ref_fasta once it's changed to an optional wdl input for ONT runs.
                            ref_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/#{ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID}.fa",
                            primer_set: nanopore_primer_set,
                            primer_schemes: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/artic-primer-schemes_v5.tar.gz",
                          }
                        elsif @workflow_run.inputs&.[]("accession_id") == ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID
                          # illumina sars-cov-2 cg
                          {
                            ref_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/#{ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID}.fa",
                            primer_bed: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/#{illumina_primer_file}",
                          }
                        else
                          # illumina gen viral cg
                          {
                            ref_accession_id: sanitize_accession_id(@workflow_run.inputs&.[]("accession_id")),
                            # This option filters all except SARS-CoV-2 at the moment:
                            filter_reads: false,
                            # This is a special empty primer file b/c the user doesn't specify a
                            # wetlab protocol from mngs samples but we still want some quality/
                            # length filtering:
                            primer_bed: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/#{NA_PRIMER_FILE}",
                          }
                        end

    run_inputs = {
      docker_image_id: retrieve_docker_image_id,
      fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
      fastqs_1: @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil,
      sample: @sample.name.tr(" ", "_"),
      ref_host: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/hg38.fa.gz",
      kraken2_db_tar_gz: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/kraken_coronavirus_db_only.tar.gz",
      ercc_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/ercc_sequences.fasta",
      technology: technology,
    }.merge(additional_inputs)

    sfn_pipeline_input_json = {
      # TODO(JIRA:IDSEQ-3163): do not use hardcoded version (outputs will still be here in the SFN version returned by the tag)
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
