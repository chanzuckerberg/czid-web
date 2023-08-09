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
    @workflow_run = workflow_run.workflow_by_class
    @sample = workflow_run.sample
    @current_user = User.find(@sample.user_id)

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN) || AppConfigHelper.get_app_config(AppConfig::SFN_AMR_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = PipelineVersionControlService.call(@sample.project.id, @workflow_run.workflow)
    raise SfnVersionMissingError, @workflow_run.workflow if @wdl_version.blank?

    # AMR uses the host filtering stage of the mNGS pipeline
    @mngs_wdl_version = AppConfigHelper.get_workflow_version(WorkflowRun::WORKFLOW[:short_read_mngs])

    if @current_user.allowed_feature_list.include?("modern_host_filtering")
      @wdl_version = AppConfigHelper.get_app_config(AppConfig::MODERN_AMR_VERSION)
      @mngs_wdl_version = AppConfigHelper.get_app_config(AppConfig::MODERN_SHORT_READ_MNGS_VERSION)
    end

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

  def retrieve_mngs_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/#{WorkflowRun::WORKFLOW[:short_read_mngs]}:v#{@mngs_wdl_version}"
  end

  def output_prefix
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample.sample_path}/#{@workflow_run.id}"
  end

  def strtrue(str)
    str == "true"
  end

  def host_filtering_parameters
    {
      "raw_reads_0": strtrue(@workflow_run.get_input("start_from_mngs")) ? nil : @sample.input_file_s3_paths[0],
      "raw_reads_1": if strtrue(@workflow_run.get_input("start_from_mngs"))
                       nil
                     else
                       (
                             @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil
                           )
                     end,
      "host_filtering_docker_image_id": retrieve_mngs_docker_image_id,
      "host_filter_stage.file_ext": @sample.fasta_input? ? "fasta" : "fastq",
      "host_filter_stage.nucleotide_type": @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || "",
      "host_filter_stage.host_genome": @sample.host_genome_name.downcase,
      "host_filter_stage.star_genome": @sample.host_genome.s3_star_index_path,
      "host_filter_stage.bowtie2_genome": @sample.host_genome.s3_bowtie2_index_path,
      "host_filter_stage.human_star_genome": HostGenome.find_by(name: "Human").s3_star_index_path,
      "host_filter_stage.human_bowtie2_genome": HostGenome.find_by(name: "Human").s3_bowtie2_index_path,
      "host_filter_stage.adapter_fasta": PipelineRun::ADAPTER_SEQUENCES[@sample.input_files[1] ? "paired-end" : "single-end"],
      "host_filter_stage.max_input_fragments": PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS,
      "host_filter_stage.max_subsample_fragments": PipelineRun::DEFAULT_SUBSAMPLING,
    }
  end

  def modern_host_filtering_parameters
    hg = @sample.host_genome
    {
      "raw_reads_0": strtrue(@workflow_run.get_input("start_from_mngs")) ? nil : @sample.input_file_s3_paths[0],
      "raw_reads_1": if strtrue(@workflow_run.get_input("start_from_mngs"))
                       nil
                     else
                       (
                             @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil
                           )
                     end,
      "host_filtering_docker_image_id": retrieve_mngs_docker_image_id,
      "host_filter_stage.adapter_fasta": PipelineRun::ADAPTER_SEQUENCES[@sample.input_files[1] ? "paired-end" : "single-end"],

      "host_filter_stage.host_genome": hg.name.downcase,
      "host_filter_stage.bowtie2_index_tar": hg.s3_bowtie2_index_path_v2,
      "host_filter_stage.hisat2_index_tar": hg.s3_hisat2_index_path,
      "host_filter_stage.kallisto_idx": hg.s3_kallisto_index_path,
      "host_filter_stage.human_bowtie2_index_tar": HostGenome.find_by(name: "Human").s3_bowtie2_index_path_v2,
      "host_filter_stage.human_hisat2_index_tar": HostGenome.find_by(name: "Human").s3_hisat2_index_path,

      "host_filter_stage.max_input_fragments": PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS,
      "host_filter_stage.max_subsample_fragments": PipelineRun::DEFAULT_SUBSAMPLING,
      "host_filter_stage.file_ext": @sample.fasta_input? ? "fasta" : "fastq",
    }
  end

  def modern_nonhost_reads
    sfn_results_path = @sample.pipeline_runs.non_deprecated.first.sfn_results_path
    [
      "#{sfn_results_path}/subsampled_1.fa",
      @sample.input_files[1] ? "#{sfn_results_path}/subsampled_2.fa" : nil,
    ].compact
  end

  def nonhost_reads
    sfn_results_path = @sample.pipeline_runs.non_deprecated.first.sfn_results_path
    [
      "#{sfn_results_path}/gsnap_filter_1.fa",
      @sample.input_files[1] ? "#{sfn_results_path}/gsnap_filter_2.fa" : nil,
    ].compact
  end

  def nonhost_reads_params
    params = nil
    if strtrue(@workflow_run.get_input("start_from_mngs"))
      params = @workflow_run.uses_modern_host_filtering? ? modern_nonhost_reads : nonhost_reads
    end

    params
  end

  def card_params
    prefix = card_prefix
    {
      card_json: "#{prefix}/card.json",
      card_ontology: "#{prefix}/ontology.json",
      kmer_db: "#{prefix}/61_kmer_db.json",
      amr_kmer_db: "#{prefix}/all_amr_61mers.txt",
      wildcard_data: "#{prefix}/wildcard_database.fasta",
      wildcard_index: "#{prefix}/index-for-model-sequences.txt",
    }
  end

  def card_prefix
    latest_card_version_folder = AppConfigHelper.get_app_config(AppConfig::CARD_FOLDER)
    "s3://#{S3_DATABASE_BUCKET}/card/#{latest_card_version_folder}"
  end

  def generate_wdl_input
    # SECURITY: To mitigate pipeline command injection, ensure any interpolated string inputs are either validated or controlled by the server.
    host_filtering_params = @workflow_run.uses_modern_host_filtering? ? modern_host_filtering_parameters : host_filtering_parameters

    run_inputs = {
      docker_image_id: retrieve_docker_image_id,
      non_host_reads: nonhost_reads_params,
      contigs: strtrue(@workflow_run.get_input("start_from_mngs")) ? "#{@sample.pipeline_runs.non_deprecated.first.sfn_results_path}/contigs.fasta" : nil,
      sample_name: @workflow_run.sample.name,
    }.merge(host_filtering_params).merge(card_params)

    sfn_pipeline_input_json = {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_run.workflow_version_tag}/run.wdl.zip",
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
